import * as ts from 'typescript';

import { runtime } from '../runtime';

/**
 * Symbols injected via module augmentation (e.g. by the resource plugin)
 * that should not appear in the runtime schema.
 */
const EXCLUDED_SYMBOLS = new Set([
  // StrictModel built-in
  '$attach',
  // Resource plugin (declare module augmentation)
  '$set',
  '$update',
  '$save',
  '$delete',
  '$metadata',
  '$processResponse',
  '$root',
  '$clone',
  '$copy',
]);

export function buildInterface(
  name: string,
  type: ts.Type,
  typeChecker: ts.TypeChecker,
): runtime.Schema {
  switch (false) {
    case !isEnumDeclaration(type.symbol):
      return {
        name,
        props: [],
      };

    default:
      const symbols: ts.Symbol[] = Array.from(
        type.symbol.members.values() as any,
      );
      return {
        name,
        props: symbols
          .filter((s) => s.getName() !== '__constructor')
          .filter((s) => !EXCLUDED_SYMBOLS.has(s.getName()))
          .map((s) => buildInterfaceProperty(s, typeChecker))
          .filter((x) => x != null),
      };
  }
}

function isEnumDeclaration(symbol: ts.Symbol): boolean {
  return symbol.declarations?.some(
    (d) => d.kind === ts.SyntaxKind.EnumDeclaration,
  );
}

function isGetterDeclaration(symbol: ts.Symbol): boolean {
  return symbol.declarations?.some((d) => d.kind === ts.SyntaxKind.GetAccessor);
}

function isSetterDeclaration(symbol: ts.Symbol): boolean {
  return symbol.declarations?.some((d) => d.kind === ts.SyntaxKind.SetAccessor);
}

function isTypeParameter(symbol: ts.Symbol): boolean {
  return symbol.declarations?.some(
    (d) => d.kind === ts.SyntaxKind.TypeParameter,
  );
}

function buildInterfaceProperty(
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): runtime.Property {
  if (isTypeParameter(symbol)) {
    return null;
  }

  const prop: runtime.Property = {
    name: symbol.getName(),
    optional: propertyOptional(symbol),
    modifier: propertyModifier(symbol),
    type: propertyType(symbol, typeChecker),
  };

  if (propertyReadonly(symbol)) {
    prop.readonly = true;
  }

  if (isAbstract(symbol)) {
    prop.abstract = true;
  }

  if (isGetterDeclaration(symbol)) {
    prop.getter = true;
  }

  if (isSetterDeclaration(symbol)) {
    prop.setter = true;
  }

  return prop;
}

function propertyReadonly(symbol: ts.Symbol): boolean {
  return (
    symbol.declarations &&
    symbol.declarations.some(
      (d: any) =>
        d.modifiers &&
        d.modifiers.some(
          (modifier: any) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
        ),
    )
  );
}

function isAbstract(symbol: ts.Symbol): boolean {
  for (const declaration of symbol.declarations) {
    for (const modifier of (declaration as any).modifiers || []) {
      if (modifier.kind === ts.SyntaxKind.AbstractKeyword) {
        return true;
      }
    }
  }

  return false;
}

function propertyModifier(symbol: ts.Symbol): runtime.Modifier {
  if (symbol.declarations == null) {
    return null;
  }

  for (const declaration of symbol.declarations) {
    for (const modifier of (declaration as any).modifiers || []) {
      switch (modifier.kind) {
        case ts.SyntaxKind.PrivateKeyword:
          return runtime.Modifier.PRIVATE;
        case ts.SyntaxKind.ProtectedKeyword:
          return runtime.Modifier.PROTECTED;
        case ts.SyntaxKind.PublicKeyword:
          return runtime.Modifier.PUBLIC;
      }
    }
  }

  return runtime.Modifier.PUBLIC;
}

function propertyOptional(symbol: ts.Symbol): boolean {
  return (
    symbol.declarations &&
    !symbol.declarations.some(
      (d) => (d as ts.PropertySignature).questionToken === undefined,
    )
  );
}

function propertyType(
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): runtime.Type {
  const declarations = symbol.declarations;
  if (!declarations?.length) {
    return null;
  }
  const declaration = declarations[0];
  if (!declaration) {
    return null;
  }
  const parent = (declaration as any).parent;
  if (!parent) {
    return null;
  }
  const typeParameters = parent.typeParameters;
  const propertySignature = (declaration as any).type;

  if (declaration.kind === ts.SyntaxKind.MethodDeclaration) {
    return 'method';
  }

  if (propertySignature == null) {
    return null;
  }

  if (typeParameters && typeParameters.length > 0) {
    const typeParam = typeParameters[0];
    return {
      genericParameterName: typeParam.getText(),
      genericParameterType: getTypeFromSignature(
        propertySignature,
        typeChecker,
      ),
    };
  } else {
    return getTypeFromSignature(propertySignature, typeChecker);
  }
}

function getTypeFromSignature(
  propertySignature: ts.PropertySignature,
  typeChecker: ts.TypeChecker,
): runtime.Type {
  const kind = propertySignature.kind as ts.SyntaxKind;
  switch (kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    case ts.SyntaxKind.FunctionKeyword:
      return 'function';
    case ts.SyntaxKind.ObjectKeyword:
      return 'object';
    case ts.SyntaxKind.NullKeyword:
      return 'null';
    case ts.SyntaxKind.AnyKeyword:
      return 'any';
    case ts.SyntaxKind.UnknownKeyword:
      return 'unknown';
    case ts.SyntaxKind.TypeReference:
      const typeArgs: ts.Node[] = (propertySignature as any).typeArguments;

      if (typeArgs && typeArgs.length > 0) {
        const typeName = (propertySignature as any).typeName;
        const typeArg = typeArgs[0] as ts.PropertySignature;
        return {
          selfType: typeName.escapedText,
          typeArgumentType: getTypeFromSignature(typeArg, typeChecker),
        };
      } else {
        return {
          referenceName: propertySignature.getText(),
        };
      }
    case ts.SyntaxKind.ArrayType:
      return {
        arrayElementType: getTypeFromSignature(
          (<ts.ArrayTypeNode>(propertySignature as any)).elementType as any,
          typeChecker,
        ),
      };
    case ts.SyntaxKind.TypeLiteral:
      const members: Map<string, ts.Symbol> = (propertySignature as any).symbol
        .members;
      console.log('members:', members);
      return {
        props: Array.from(members.values())
          .map((m) => buildInterfaceProperty(m, typeChecker))
          .filter((x) => x != null),
      };
    case ts.SyntaxKind.UnionType:
      const union = (propertySignature as any as ts.UnionTypeNode).types.map(
        (t) => {
          return getTypeFromSignature(t as any, typeChecker);
        },
      );
      return { union };
    default:
      return null;
  }
}
