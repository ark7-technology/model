import 'reflect-metadata';

import _ from 'underscore';

import { ARK7_MODEL_CONFIG, ARK7_MODEL_FIELD } from './tokens';
import { Ark7ModelFields, ConfigOptions, ModelClass } from './fields';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { runtime } from './runtime';

export function A7Model<T = {}>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
): ClassDecorator {
  return (constructor: Function) => {
    const configOptions: ConfigOptions = Reflect.getMetadata(
      ARK7_MODEL_CONFIG,
      constructor,
    );

    const resolver = options.resolver ?? DEFAULT_OPTIONS_RESOLVER;

    const newOptions =
      configOptions == null ? options : resolver(configOptions, options);

    Reflect.defineMetadata(
      ARK7_MODEL_CONFIG,
      _.defaults({ schema }, newOptions),
      constructor,
    );

    manager.register(constructor.name, constructor as any);
  };
}

export interface Ark7ModelMetadata {
  name: string;
  modelClass: ModelClass<any>;
  configs?: ConfigOptions;
  fields?: Ark7ModelFields;
}

export class A7ModelManager {
  private metadataMap: Map<string, Ark7ModelMetadata> = new Map();

  constructor() {}

  getMetadata<T>(name: string | ModelClass<T>): Ark7ModelMetadata {
    const key = _.isString(name) ? name : name.name;
    const metadata = this.metadataMap.get(key);

    if (metadata == null) {
      throw new Error(`Metadata ${key} not set`);
    }

    if (metadata.configs == null) {
      metadata.configs =
        Reflect.getMetadata(ARK7_MODEL_CONFIG, metadata.modelClass) || {};
    }

    if (metadata.fields == null) {
      metadata.fields =
        Reflect.getMetadata(ARK7_MODEL_FIELD, metadata.modelClass.prototype) ||
        {};
    }

    return metadata;
  }

  register<T>(name: string, modelClass: ModelClass<T>) {
    this.metadataMap.set(name, {
      name,
      modelClass,
    });
  }
}

export const manager = new A7ModelManager();

export namespace A7Model {
  export function getMetadata<T>(
    model: string | ModelClass<T>,
  ): Ark7ModelMetadata {
    return manager.getMetadata(model);
  }
}
