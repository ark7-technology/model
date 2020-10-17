import 'reflect-metadata';

import _ from 'underscore';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import { Ark7ModelFields, ConfigOptions, ModelClass } from './fields';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { runtime } from './runtime';

export function Config<T = {}>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return (constructor: Function) => {
    const configOptions: ConfigOptions = Reflect.getMetadata(
      A7_MODEL_CONFIG,
      constructor,
    );

    const resolver = options.resolver ?? DEFAULT_OPTIONS_RESOLVER;

    const newOptions =
      configOptions == null ? options : resolver(configOptions, options);

    Reflect.defineMetadata(
      A7_MODEL_CONFIG,
      _.defaults({ schema }, newOptions),
      constructor,
    );

    if (schema != null) {
      manager.register(name ?? constructor.name, constructor as any);
    }
  };
}

export function A7Model<T = {}>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return Config(options, schema, name);
}

export interface Ark7ModelMetadata {
  name: string;
  modelClass: ModelClass<any>;
  superClass?: ModelClass<any>;
  configs?: ConfigOptions;
  fields?: Ark7ModelFields;
}

export class A7ModelManager {
  private metadataMap: Map<string, Ark7ModelMetadata> = new Map();

  constructor() {}

  reset() {
    this.metadataMap.clear();
  }

  getMetadata<T>(name: string | ModelClass<T>): Ark7ModelMetadata {
    const key = _.isString(name) ? name : name.name;
    const metadata = this.metadataMap.get(key);

    if (metadata == null) {
      throw new Error(`Metadata ${key} not set`);
    }

    if (metadata.configs == null) {
      metadata.configs =
        Reflect.getMetadata(A7_MODEL_CONFIG, metadata.modelClass) || {};
    }

    if (metadata.fields == null) {
      metadata.fields =
        (metadata.modelClass.prototype
          ? Reflect.getMetadata(A7_MODEL_FIELD, metadata.modelClass.prototype)
          : {}) || {};
    }

    return metadata;
  }

  register<T>(name: string, modelClass: ModelClass<T>) {
    const superClass = modelClass?.prototype?.__proto__?.constructor;
    this.metadataMap.set(name, {
      name,
      modelClass,
      superClass:
        superClass != null && superClass !== Object.prototype.constructor
          ? superClass
          : null,
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

  export function reset() {
    manager.reset();
  }

  export function provide(target: any, schema?: runtime.Schema, name?: string) {
    A7Model({}, schema, name)(target);
  }
}
