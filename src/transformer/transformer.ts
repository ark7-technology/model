import * as _ from 'underscore';
import * as ts from 'typescript';

import { buildInterface } from './runtime-schema';

declare global {
  var process: any;
}

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

const badInterface = ts.factory.createRegularExpressionLiteral(
  JSON.stringify({
    name: 'never',
    props: [],
  }),
);

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker();

  let sourceFile: any;

  for (let root = node.parent; root != null; root = root.parent) {
    if (root.constructor.name === 'SourceFileObject') {
      sourceFile = root;
      break;
    }
  }

  let fileName = sourceFile?.fileName;

  if (typeof process !== 'undefined' && fileName != null) {
    if (fileName.startsWith(process.cwd())) {
      fileName = fileName.substring(process.cwd().length + 1);
    }
  }

  if (
    ts.isDecorator(node) &&
    (node.expression as any)?.expression?.escapedText === 'A7Model'
  ) {
    const parent: any = node.parent;

    const type = typeChecker.getTypeAtLocation(parent);

    const literal = ts.factory.createRegularExpressionLiteral(
      JSON.stringify(
        _.extend(
          buildInterface(type.symbol.escapedName as string, type, typeChecker),
          {
            fileName,
          },
        ),
      ),
    );

    const elements = [...(node.expression as any).arguments, literal];

    const exp: any = node.expression;

    const expression = ts.factory.updateCallExpression(
      exp,
      exp.expression,
      exp.typeArguments,
      elements,
    );

    return ts.factory.updateDecorator(node, expression);
  }

  if (!isRuntimeTypeCallExpression(node, typeChecker)) {
    return node;
  }

  if (!node.arguments?.length && !node.typeArguments?.length) {
    return badInterface;
  }

  if (node.typeArguments?.length) {
    const typeNode = node.typeArguments[0];

    const name = ts.factory.createStringLiteral(typeNode.getText());

    const literal = ts.factory.createRegularExpressionLiteral(
      JSON.stringify({}),
    );

    const elements = [...node.arguments, literal, name];

    const args = ts.factory.createNodeArray(
      elements,
      node.arguments.hasTrailingComma,
    );

    return ts.factory.updateCallExpression(
      node,
      node.expression,
      node.typeArguments,
      args,
    );
  } else {
    const i = node.arguments[0];

    if (ts.isIdentifier(i)) {
      const t = typeChecker.getTypeAtLocation(i) as any;

      const name = ts.factory.createStringLiteral(t.symbol.escapedName);

      const literal = ts.factory.createRegularExpressionLiteral(
        JSON.stringify(
          _.extend(buildInterface(t.symbol.escapedName, t, typeChecker), {
            fileName,
          }),
        ),
      );

      const elements = [...node.arguments, literal, name];

      const args = ts.factory.createNodeArray(
        elements,
        node.arguments.hasTrailingComma,
      );

      return ts.factory.updateCallExpression(
        node,
        node.expression,
        node.typeArguments,
        args,
      );
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
