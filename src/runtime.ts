import * as _ from 'underscore';

export namespace runtime {
  /** @since 1.5.0 */
  export type Type =
    | null
    | string
    | ArrayType
    | ReferenceType
    | ParameterizedType
    | GenericType
    | LiteralType
    | UnionType;

  export enum Modifier {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    PROTECTED = 'PROTECTED',
  }

  /** @since 1.0.0 */
  export interface Property {
    name: string;
    optional: boolean;
    type: Type;
    modifier: Modifier;
    readonly?: true;
    abstract?: true;
    getter?: true;
    setter?: true;
  }

  /** @since 1.0.0 */
  export interface ArrayType {
    arrayElementType: Type;
  }

  /** @since 1.0.0 */
  export interface ReferenceType {
    referenceName: string;
  }

  /** @since 1.2.0 */
  export interface ParameterizedType {
    selfType: string;
    typeArgumentType: Type;
  }

  /** @since 1.2.0 */
  export interface GenericType {
    genericParameterName: string;
    genericParameterType: Type;
  }

  /** @since 1.5.0 */
  export interface LiteralType {
    props: Property[];
  }

  /** @since 1.6.0 */
  export interface UnionType {
    union: Type[];
  }

  /** @since 1.0.0 */
  export interface Schema {
    name: string;
    props: Property[];
    fileName?: string;
    protoNestedIn?: string;
    protoMessageName?: string;
  }

  export function isReferenceType(type: Type): type is ReferenceType {
    return (type as ReferenceType)?.referenceName != null;
  }

  export function isArrayType(type: Type): type is ArrayType {
    return (type as ArrayType)?.arrayElementType != null;
  }

  export function isParameterizedType(type: Type): type is ParameterizedType {
    return (type as ParameterizedType)?.selfType != null;
  }

  export function typeName(type: Type): string {
    if (_.isString(type)) {
      return type;
    }

    if (isReferenceType(type)) {
      return type.referenceName;
    }

    if (isArrayType(type)) {
      return `${typeName(type.arrayElementType)}[]`;
    }

    if (isParameterizedType(type)) {
      return `${type.selfType}<${typeName(type.typeArgumentType)}>`;
    }

    return type?.toString();
  }
}
