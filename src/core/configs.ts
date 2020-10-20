import 'reflect-metadata';

import _ from 'underscore';

import { A7_MODEL_CONFIG } from './tokens';
import {
  Ark7ModelFields,
  CombinedModelField,
  ConfigOptions,
  ModelClass,
} from './fields';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { Manager, manager } from './manager';
import { createEnumModelClass } from './enums';
import { runtime } from './runtime';

export function Config<T = object>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return (constructor: ModelClass<any> | object) => {
    const cls: ModelClass<any> = _.isFunction(constructor)
      ? constructor
      : createEnumModelClass(constructor);

    const configOptions: ConfigOptions = Reflect.getMetadata(
      A7_MODEL_CONFIG,
      cls,
    );

    const resolver = options.resolver ?? DEFAULT_OPTIONS_RESOLVER;

    const newOptions =
      configOptions == null ? options : resolver(configOptions, options);

    delete newOptions.resolver;

    Reflect.defineMetadata(
      A7_MODEL_CONFIG,
      _.defaults({ schema }, newOptions),
      cls,
    );

    if (schema != null) {
      manager.register(name ?? cls.name, cls);
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

  combinedFields: Map<string, CombinedModelField>;

  constructor(cls: ModelClass<any>, name?: string) {
    this.name = name || cls?.name;
    this.modelClass = cls;
    const superClass = cls?.prototype?.__proto__?.constructor;
    this.superClass =
      superClass != null && superClass !== Object.prototype.constructor
        ? superClass
        : null;
  }

  createCombinedFields(manager: Manager) {
    if (this.combinedFields != null) {
      return;
    }

    this.combinedFields = new Map();

    const propNames = _.map(this.configs.schema.props, (p) => p.name);
    const fieldNames = _.keys(this.fields);
    const names = _.uniq([...propNames, ...fieldNames]);

    for (const name of names) {
      const prop = _.find(this.configs.schema.props, (p) => p.name === name);
      const field = this.fields[name];

      const descriptor = Object.getOwnPropertyDescriptor(
        this.modelClass.prototype,
        name,
      );

      this.combinedFields.set(
        name,
        new CombinedModelField(name, prop, descriptor, field?.options),
      );
    }

    if (this.superClass != null) {
      const superMetadata = manager.getMetadata(this.superClass);
      const allNames = _.union([
        ...this.combinedFields.keys(),
        ...superMetadata.combinedFields.keys(),
      ]);

      for (const name of allNames) {
        const a = this.combinedFields.get(name);
        const b = superMetadata.combinedFields.get(name);

        if (a == null || b == null) {
          this.combinedFields.set(name, a ?? b);
        } else {
          this.combinedFields.set(name, a.merge(b));
        }
      }
    }
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
