import * as ts from 'typescript';

import { buildInterface } from './runtime-schema';

export function transform(
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) =>
    visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(
  node: ts.SourceFile,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.SourceFile;

function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node;

function visitNodeAndChildren(
  node: ts.Node,
  program: ts.Program,
  context: ts.TransformationContext,
): ts.Node {
  return ts.visitEachChild(
    visitNode(node, program),
    (child) => visitNodeAndChildren(child, program, context),
    context,
  );
}

const badInterface = ts.createRegularExpressionLiteral(
  JSON.stringify({
    name: 'never',
    props: [],
  }),
);

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker();

  if (
    ts.isDecorator(node) &&
    (node.expression as any)?.expression?.escapedText === 'A7Model'
  ) {
    const parent: any = node.parent;

    const type = typeChecker.getTypeAtLocation(parent);

    const literal = ts.createRegularExpressionLiteral(
      JSON.stringify(
        buildInterface(type.symbol.escapedName as string, type, typeChecker),
      ),
    );

    const elements = [...(node.expression as any).arguments, literal];

    const exp: any = node.expression;

    const expression = ts.updateCall(
      exp,
      exp.expression,
      exp.typeArguments,
      elements,
    );

    return ts.updateDecorator(node, expression);
  }

  if (!isRuntimeTypeCallExpression(node, typeChecker)) {
    return node;
  }

  if (!node.arguments?.length && !node.typeArguments?.length) {
    return badInterface;
  }

  if (node.typeArguments?.length) {
    const typeNode = node.typeArguments[0];

    const name = ts.createStringLiteral(typeNode.getText());

    const literal = ts.createRegularExpressionLiteral(JSON.stringify({}));

    const elements = [...node.arguments, literal, name];

    const args = ts.createNodeArray(elements, node.arguments.hasTrailingComma);

    return ts.updateCall(node, node.expression, node.typeArguments, args);
  } else {
    const i = node.arguments[0];

    if (ts.isIdentifier(i)) {
      const t = typeChecker.getTypeAtLocation(i) as any;

      const name = ts.createStringLiteral(t.symbol.escapedName);

      const literal = ts.createRegularExpressionLiteral(
        JSON.stringify(buildInterface(t.symbol.escapedName, t, typeChecker)),
      );

      const elements = [...node.arguments, literal, name];

      const args = ts.createNodeArray(
        elements,
        node.arguments.hasTrailingComma,
      );

      return ts.updateCall(node, node.expression, node.typeArguments, args);
    }
  }
}

function isRuntimeTypeCallExpression(
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  const signature = typeChecker.getResolvedSignature(node);
  if (signature === undefined) {
    return false;
  }
  const { declaration } = signature;

  return (
    !!declaration &&
    !ts.isJSDocSignature(declaration) &&
    !!declaration.name &&
    declaration.name.getText() === 'provide'
  );
}
