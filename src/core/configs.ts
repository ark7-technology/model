import 'reflect-metadata';

import * as _ from 'underscore';

import { A7_MODEL_CONFIG } from './tokens';
import {
  Ark7ModelFields,
  CombinedModelField,
  ConfigOptions,
  DocumentToObjectOptions,
  ModelClass,
  ModelizeOptions,
} from './fields';
import { Converter, converter } from './converter';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { DefaultDataLevel } from './levels';
import { Enum, createEnumModelClass } from './enums';
import { Manager, manager } from './manager';
import { runtime } from '../runtime';

export function Config<T = object>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return (constructor: object | ProvideOptions<any> | ModelClass<any>) => {
    const cls: ModelClass<any> = _.isFunction(constructor)
      ? constructor
      : _.isEmpty(schema) /** a registered type */
      ? converter(constructor, name)
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
      manager.register(name ?? schema.name ?? cls.name, cls);
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

  get isCustomizedType(): boolean {
    return this.modelClass.prototype instanceof Converter;
  }

  get isEnum(): boolean {
    return this.modelClass.prototype instanceof Enum;
  }

  get enums(): object {
    return (this.modelClass as any).enums;
  }

  get enumType(): 'string' | 'number' {
    const values = _.values(this.enums);

    return _.find(values, (v) => _.isNumber(v)) != null ? 'number' : 'string';
  }

  get enumValues(): string[] | number[] {
    const type = this.enumType;
    const values = _.values(this.enums);

    return type === 'number' ? _.filter(values, _.isNumber) : values;
  }

  get classes(): ModelClass<any>[] {
    const mixinClasses: ModelClass<any>[] = this.configs?.mixinClasses || [];

    return _.chain([this.superClass, this.modelClass, ...mixinClasses])
      .filter(_.identity)
      .map((cls) =>
        cls === Enum || cls === Converter || cls === this.modelClass
          ? cls
          : A7Model.getMetadata(cls).classes,
      )
      .flatten()
      .union()
      .value();
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

    const mixinClasses = _.filter(
      [this.superClass, ...(this.configs.mixinClasses || [])],
      (c) => c != null && c !== Enum && c !== Converter,
    );

    for (const mixinClass of mixinClasses) {
      const superMetadata = manager.getMetadata(mixinClass);
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

  toObject(obj: any, options: DocumentToObjectOptions = {}): any {
    if (obj == null) {
      return obj;
    }

    const level = options.level ?? DefaultDataLevel.NEVER - 1;

    const ret: any = {};
    for (const name of this.combinedFields.keys()) {
      const field = this.combinedFields.get(name);
      if (field.isMethod) {
        continue;
      }

      if (field.level > level) {
        continue;
      }

      const target = obj[name];

      if (!_.isUndefined(target)) {
        ret[name] = field.toObject(target, options);
      }
    }
    return ret;
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

  /** target is an enum */
  export function provide(target: object): void;
  /** target is a model */
  export function provide(target: ModelClass<any>): void;
  /** target is a customized type */
  export function provide<T>(options?: ProvideOptions<T>): void;

  export function provide<T>(
    target?: object | ProvideOptions<T> | ModelClass<any>,
    schema?: runtime.Schema,
    name?: string,
  ) {
    A7Model({}, schema, name)(target as any);
  }
}

export interface ProvideOptions<T> {
  name?: string;
  modelize?: (val: any, options: ModelizeOptions) => T;
  toObject?: (val: any, options: DocumentToObjectOptions) => any;
}
