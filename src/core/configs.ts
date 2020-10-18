import 'reflect-metadata';

import _ from 'underscore';

import { A7_MODEL_CONFIG } from './tokens';
import { Ark7ModelFields, ConfigOptions, ModelClass } from './fields';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { manager } from './manager';
import { runtime } from './runtime';

export function Config<T = object>(
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

export function A7Model<T = object>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return Config(options, schema, name);
}

export class Ark7ModelMetadata {
  name: string;
  modelClass: ModelClass<any>;
  superClass: ModelClass<any>;
  configs: ConfigOptions;
  fields: Ark7ModelFields;

  constructor(cls: ModelClass<any>, name?: string) {
    this.name = name || cls?.name;
    this.modelClass = cls;
    const superClass = cls?.prototype?.__proto__?.constructor;
    this.superClass =
      superClass != null && superClass !== Object.prototype.constructor
        ? superClass
        : null;
  }
}

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
