import 'reflect-metadata';

import * as _ from 'underscore';
import * as debug from 'debug';

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
import { GetMetadataOptions, Manager, manager } from './manager';
import { runtime } from '../runtime';

const d = debug('ark7:model:configs');

export function Config<T = object>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return (constructor: object | ProvideOptions<any> | ModelClass<any>) => {
    const cls: ModelClass<any> = (
      _.isFunction(constructor)
        ? constructor
        : _.isEmpty(schema) /** a registered type */
        ? converter(constructor, name)
        : createEnumModelClass(constructor)
    ) as any;

    const configOptions: ConfigOptions = getArk7ModelConfig(cls);

    const resolver = options.resolver ?? DEFAULT_OPTIONS_RESOLVER;

    const newOptions =
      configOptions == null ? options : resolver(configOptions, options);

    delete newOptions.resolver;

    // Pass back the parent discriminator key.
    if (cls.$discriminatorKey && newOptions.discriminatorKey == null) {
      newOptions.discriminatorKey = cls.$discriminatorKey;
    }

    if (schema != null) {
      _.defaults(configOptions, { schema });
    }
    _.extend(configOptions, newOptions);

    defineArk7ModelConfig(cls, configOptions);

    // discriminator key is required to pass down.
    if (newOptions.discriminatorKey) {
      cls.$discriminatorKey = newOptions.discriminatorKey;
    }

    if (schema != null) {
      manager.register(name ?? schema.name ?? cls.name, cls);
      // TODO: Enable this still gives side effects with statics methods.
      // manager.getMetadata(cls); // Trigger discriminator calculation.
    }

    if (newOptions.discriminatorKey != null) {
      const superClass = cls?.prototype?.__proto__?.constructor;

      if (superClass != null) {
        Ark7ModelMetadata.addDiscriminations(superClass, cls);
      }
    }
  };
}

export function getArk7ModelConfig<T extends object, P = object>(
  target: ModelClass<T>,
): ConfigOptions<P> {
  let config = Reflect.getOwnMetadata(A7_MODEL_CONFIG, target);

  if (config == null) {
    config = {};
    Reflect.defineMetadata(A7_MODEL_CONFIG, {}, target);
  }

  return config;
}

export function defineArk7ModelConfig<T extends object, P = object>(
  target: ModelClass<T>,
  config: ConfigOptions<P>,
) {
  Reflect.defineMetadata(A7_MODEL_CONFIG, config, target);
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
  discriminations: ModelClass<any>[] = [];
  fields: Ark7ModelFields;

  combinedFields: Map<string, CombinedModelField>;

  static discriminationsMap = new Map<ModelClass<any>, ModelClass<any>[]>();

  static addDiscriminations(parentCls: ModelClass<any>, cls: ModelClass<any>) {
    if (!this.discriminationsMap.has(parentCls)) {
      this.discriminationsMap.set(parentCls, []);
    }

    this.discriminationsMap.get(parentCls).push(cls);

    if (manager.hasMetadata(parentCls)) {
      manager.getMetadata(parentCls).discriminations.push(cls);
    }
  }

  static getDiscriminations(cls: ModelClass<any>) {
    return this.discriminationsMap.get(cls) ?? [];
  }

  private _configs: ConfigOptions;

  constructor(private cls: ModelClass<any>, name?: string) {
    this.name = name || cls?.name;
    this.modelClass = cls;
    const superClass = cls?.prototype?.__proto__?.constructor;
    this.superClass =
      superClass != null && superClass !== Object.prototype.constructor
        ? superClass
        : null;

    this.discriminations.push(...Ark7ModelMetadata.getDiscriminations(cls));
  }

  get configs(): ConfigOptions {
    return this._configs;
  }

  set configs(configs: ConfigOptions) {
    this._configs = configs;

    if (
      this.superClass &&
      this.superClass !== Enum &&
      this.superClass !== Converter
    ) {
      const metadata = manager.getMetadata(this.superClass);
      if (
        metadata.configs.discriminatorKey &&
        !metadata.discriminations.includes(this.cls)
      ) {
        metadata.discriminations.push(this.cls);
      }
    }
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

  /**
   * Return related classes with priority from low to high.
   */
  get classes(): ModelClass<any>[] {
    const mixinClasses: ModelClass<any>[] = this.configs?.mixinClasses || [];

    return _.chain([this.superClass, ...mixinClasses, this.modelClass])
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

  /**
   * All the tags for the fields.
   */
  get tags(): string[] {
    return _.chain(Array.from(this.combinedFields.values()))
      .map((f) => f.field.tags)
      .flatten()
      .uniq()
      .value();
  }

  createCombinedFields(manager: Manager) {
    d('createCombinedFields started.');
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

      if (descriptor != null || prop != null || field?.options?.manual) {
        this.combinedFields.set(
          name,
          new CombinedModelField(
            name,
            prop,
            descriptor,
            field?.options,
            this.modelClass,
          ),
        );
      }
    }

    const mixinClasses = _.filter(
      [this.superClass, ...(this.configs.mixinClasses || [])],
      (c) => c != null && c !== Enum && c !== Converter,
    );

    for (const mixinClass of mixinClasses.reverse()) {
      const superMetadata = manager.getMetadata(mixinClass, {
        forceFields: true,
      });
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

    d('createCombinedFields completed.');
  }

  getFieldsByTag(tag: string): CombinedModelField[] {
    return _.filter(Array.from(this.combinedFields.values()), (f) =>
      f.hasTag(tag),
    );
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
    options?: GetMetadataOptions,
  ): Ark7ModelMetadata {
    return manager.getMetadata(model, options);
  }

  export function hasMetadata<T>(name: string | ModelClass<T>): boolean {
    return manager.hasMetadata(name);
  }

  export function reset() {
    manager.reset();
  }

  /** target is an enum */
  export function provide(
    target: object,
    customOptions?: CustomProvideOptions,
  ): void;
  /** target is a model */
  export function provide(
    target: ModelClass<any>,
    customOptions?: CustomProvideOptions,
  ): void;
  /** target is a customized type */
  export function provide<T>(options?: ProvideOptions<T>): void;

  export function provide<T>(
    target?: object | ProvideOptions<T> | ModelClass<any>,
    schema?: runtime.Schema | CustomProvideOptions,
    name?: string | runtime.Schema,
    extraName?: string,
  ) {
    if (extraName != null) {
      A7Model(
        {},
        _.extend(name, schema) as runtime.Schema,
        extraName,
      )(target as any);
    } else {
      A7Model({}, schema as runtime.Schema, name as string)(target as any);
    }
  }
}

export interface ProvideOptions<T> {
  name?: string;
  modelize?: (val: any, options: ModelizeOptions) => T;
  toObject?: (val: any, options: DocumentToObjectOptions) => any;
}

export interface CustomProvideOptions {
  protoNestedIn?: any;
}
