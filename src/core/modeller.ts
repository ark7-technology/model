import _ from 'underscore';

import {
  Ark7ModelField,
  Ark7ModelFields,
  ConfigOptions,
  ModelClass,
  getArk7ModelConfig,
  getArk7ModelField,
} from './fields';

export abstract class Ark7Modeller<T> {
  generateArk7Model$$(_x: any): T {
    throw new Error('generate not override.');
  }

  protected abstract generateWithSchema(
    schema: runtime.Schema,
    ...args: any[]
  ): T;
}

export class Ark7MetaModeller extends Ark7Modeller<Ark7ModelMetadata> {
  protected generateWithSchema<T extends object>(
    schema: runtime.Schema,
    modelClass: ModelClass<T>,
  ): Ark7ModelMetadata {
    const fields = getArk7ModelField(modelClass);

    const declarations: Ark7ModelField[] = _.chain(schema.props)
      .filter((p) => p.modifier === runtime.Modifier.PUBLIC)
      .map((p) => ({
        propertyName: p.name,
        options: {
          optional: p.optional,
        },
        type: p.type,
      }))
      .value() as any;

    for (const declaration of declarations) {
      const name = declaration.propertyName;

      if (fields[name] == null) {
        fields[name] = declaration;
      } else {
        _.defaults(fields[name], { type: declaration.type });
        _.defaults(fields[name].options, declaration.options);
      }
    }

    return {
      name: modelClass.name,
      configs: getArk7ModelConfig(modelClass),
      fields,
    };
  }
}

export interface Ark7ModelMetadata {
  name: string;
  configs: ConfigOptions;
  fields: Ark7ModelFields;
}

export const metaModeller = new Ark7MetaModeller();

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
}
