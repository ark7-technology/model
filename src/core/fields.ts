import 'reflect-metadata';

import _ from 'underscore';

import { ARK7_MODEL_CONFIG, ARK7_MODEL_FIELD } from './tokens';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { runtime } from './runtime';

export function Field(options: FieldOptions = {}): PropertyDecorator {
  return (target: any, propertyName: string) => {
    const fields: Ark7ModelFields =
      Reflect.getMetadata(ARK7_MODEL_FIELD, target) || {};

    Reflect.defineMetadata(
      ARK7_MODEL_FIELD,
      mergeFields(fields, propertyName, options),
      target,
    );
  };
}

export function getArk7ModelConfig<T extends object, P = {}>(
  target: ModelClass<T>,
): ConfigOptions<P> {
  return Reflect.getMetadata(ARK7_MODEL_CONFIG, target) || {};
}

export function getArk7ModelField<T>(target: ModelClass<T>): Ark7ModelFields {
  return Reflect.getMetadata(ARK7_MODEL_FIELD, target.prototype) || {};
}

export interface ModelClass<T> {
  new (...args: any[]): T;
}

function mergeFields(
  fields: Ark7ModelFields,
  propertyName: string,
  options: FieldOptions,
): Ark7ModelFields {
  const resolver = options.resolver ?? DEFAULT_OPTIONS_RESOLVER;

  const newOptions =
    fields[propertyName] == null
      ? options
      : resolver(fields[propertyName].options, options);

  return _.extend(
    {
      [propertyName]: {
        propertyName,
        options: newOptions,
      },
    },
    fields,
  );
}

export type BaseOptions<T = {}> = T & {
  resolver?: OptionsResolver<T>;
};

export type OptionsResolver<
  T = {},
  O extends BaseOptions<T> = BaseOptions<T>
> = (baseOptions: O, options: O) => O;

export type FieldOptionsResolver<T = {}> = OptionsResolver<FieldOptions<T>>;

export type FieldOptions<T = {}> = BaseOptions<
  T & {
    optional?: boolean;
    readonly?: boolean;
  }
>;

export type ConfigOptionsResolver<T = {}> = OptionsResolver<ConfigOptions<T>>;

export type ConfigOptions<T = {}> = BaseOptions<
  T & {
    schema?: runtime.Schema;
  }
>;

export interface Ark7ModelField<T = any> {
  propertyName: string;
  options: FieldOptions;
  type: T;
}

export interface Ark7ModelFields {
  [key: string]: Ark7ModelField;
}
