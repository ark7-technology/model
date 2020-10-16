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
    readonly: boolean;
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
  }

  export function isReferenceType(type: Type): type is ReferenceType {
    return (type as ReferenceType).referenceName != null;
  }

  export function isArrayType(type: Type): type is ArrayType {
    return (type as ArrayType).arrayElementType != null;
  }
}
