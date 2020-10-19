import 'reflect-metadata';

import _ from 'underscore';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { runtime } from './runtime';

export function Field<T = StrictFieldOption>(
  options?: FieldOptions<T>,
): PropertyDecorator {
  return (target: any, propertyName: string) => {
    const fields: Ark7ModelFields =
      Reflect.getMetadata(A7_MODEL_FIELD, target) || {};

    Reflect.defineMetadata(
      A7_MODEL_FIELD,
      mergeFields(fields, propertyName, options),
      target,
    );
  };
}

export function getArk7ModelConfig<T extends object, P = object>(
  target: ModelClass<T>,
): ConfigOptions<P> {
  return Reflect.getMetadata(A7_MODEL_CONFIG, target) || {};
}

export function getArk7ModelField<T>(target: ModelClass<T>): Ark7ModelFields {
  return Reflect.getMetadata(A7_MODEL_FIELD, target.prototype) || {};
}

export interface ModelClass<T> {
  new (...args: any[]): T;
}

function mergeFields(
  fields: Ark7ModelFields,
  propertyName: string,
  options: FieldOptions = {},
): Ark7ModelFields {
  const resolver = options.resolver ?? DEFAULT_OPTIONS_RESOLVER;

  const newOptions =
    fields[propertyName] == null
      ? options
      : resolver(fields[propertyName].options, options);

  return _.defaults(
    {
      [propertyName]: {
        name: propertyName,
        options: newOptions,
      },
    },
    fields,
  );
}

export type BaseOptions<T = object> = T & {
  resolver?: OptionsResolver<T>;
};

export type OptionsResolver<
  T = {},
  O extends BaseOptions<T> = BaseOptions<T>
> = (baseOptions: O, options: O) => O;

export type FieldOptionsResolver<T = object> = OptionsResolver<FieldOptions<T>>;

export interface StrictFieldOption {
  type?: ModelClass<any> | Function;
}

export type FieldOptions<T = StrictFieldOption> = BaseOptions<
  T & StrictFieldOption
>;

export type ConfigOptionsResolver<T = object> = OptionsResolver<
  ConfigOptions<T>
>;

export type ConfigOptions<T = object> = BaseOptions<
  T & {
    schema?: runtime.Schema;
    defaultLevel?: number;
    toObject?: DocumentToObjectOptions;
    toJSON?: DocumentToObjectOptions;
  }
>;

export interface DocumentToObjectOptions {
  /** apply all getters (path and virtual getters) */
  getters?: boolean;
  /** apply virtual getters (can override getters option) */
  virtuals?: boolean;
  /** remove empty objects (defaults to true) */
  minimize?: boolean;
  /**
   * A transform function to apply to the resulting document before returning
   * @param doc The mongoose document which is being converted
   * @param ret The plain object representation which has been converted
   * @param options The options in use (either schema options or the options
   *                passed inline)
   */
  transform?: (doc: any, ret: any, options: any) => any;
  /** depopulate any populated paths, replacing them with their original refs
   * (defaults to false) */
  depopulate?: boolean;
  /** whether to include the version key (defaults to true) */
  versionKey?: boolean;
  /** whether to convert Maps to POJOs. (defaults to false) */
  flattenMaps?: boolean;
  /** data level for projection. (defaults to null) */
  level?: number;
}

export interface Ark7ModelField {
  name: string;
  options: FieldOptions;
}

export interface Ark7ModelFields {
  [key: string]: Ark7ModelField;
}

export class CombinedModelField {
  constructor(
    public name: string,
    public prop: runtime.Property,
    public descriptor: PropertyDescriptor = null,
    public field: FieldOptions = null,
  ) {}

  merge(_b: CombinedModelField): CombinedModelField {
    return this;
  }
}
