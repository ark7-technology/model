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

/**
 * Low-level class decorator that registers a model with the A7Model system.
 *
 * Merges the provided {@link ConfigOptions} with any existing config on the
 * class (via the options resolver), attaches the transformer-generated
 * schema, and registers the class with the global {@link Manager}. Also
 * handles discriminator key propagation for polymorphic model hierarchies.
 *
 * Most users should use the {@link A7Model} alias instead of calling this
 * directly.
 *
 * @param options - Model configuration options (defaultLevel, toObject,
 *   toJSON, discriminatorKey, mixinClasses, etc.).
 * @param schema - The transformer-generated schema containing property type
 *   information. Injected automatically by the TypeScript transformer at
 *   compile time.
 * @param name - Optional override for the model registration name. Defaults
 *   to the schema name or the class name.
 * @returns A class decorator.
 */
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

/**
 * Retrieves the {@link ConfigOptions} stored on a model class via
 * `reflect-metadata`. If no config exists yet, initializes an empty one.
 *
 * @param target - The model class to read config from.
 * @returns The current configuration options for the class.
 */
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

/**
 * Stores {@link ConfigOptions} on a model class via `reflect-metadata`,
 * replacing any existing config.
 *
 * @param target - The model class to attach config to.
 * @param config - The configuration options to store.
 */
export function defineArk7ModelConfig<T extends object, P = object>(
  target: ModelClass<T>,
  config: ConfigOptions<P>,
) {
  Reflect.defineMetadata(A7_MODEL_CONFIG, config, target);
}

/**
 * Class decorator that registers a model with the A7Model system.
 *
 * This is the primary decorator for defining models. The TypeScript
 * transformer automatically injects the `schema` parameter at compile time,
 * so typical usage only requires the `options` argument.
 *
 * At decoration time, A7Model:
 * 1. Merges `options` with any inherited config from parent classes.
 * 2. Attaches the transformer-generated schema (property names, types,
 *    modifiers).
 * 3. Registers the class in the global model {@link Manager} so it can be
 *    looked up by name for reference resolution and modelize.
 * 4. Propagates `discriminatorKey` for polymorphic hierarchies.
 *
 * @param options - Model configuration options. Common options include:
 *   - `defaultLevel` — Default data level for field visibility.
 *   - `toObject` / `toJSON` — Default {@link DocumentToObjectOptions} for
 *     serialization.
 *   - `discriminatorKey` — Field name used for polymorphic discrimination.
 *   - `mixinClasses` — Additional classes whose fields are merged into this
 *     model.
 * @param schema - Transformer-generated schema. Injected automatically at
 *   compile time — do not pass manually.
 * @param name - Optional registration name override. Defaults to the class
 *   name.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * @A7Model({})
 * class User extends Model {
 *   email: string;
 *   name?: string;
 * }
 *
 * @A7Model({ defaultLevel: DefaultDataLevel.SHORT })
 * class Profile extends StrictModel {
 *   bio?: string;
 * }
 * ```
 */
export function A7Model<T = object>(
  options: ConfigOptions<T>,
  schema?: runtime.Schema,
  name?: string,
): ClassDecorator {
  return Config(options, schema, name);
}

/**
 * Runtime metadata for a model class registered with {@link A7Model}.
 *
 * Each `@A7Model` decorated class has a corresponding `Ark7ModelMetadata`
 * instance managed by the global {@link Manager}. It holds the merged schema,
 * field definitions, inheritance chain, and discriminator mappings used by
 * `modelize()`, `toObject()`, and other core operations.
 *
 * Retrieve metadata via {@link A7Model.getMetadata}:
 * ```typescript
 * const metadata = A7Model.getMetadata(User);
 * metadata.name;           // 'User'
 * metadata.combinedFields; // Map of all fields (own + inherited)
 * ```
 */
export class Ark7ModelMetadata {
  /** The registered name of the model (usually the class name). */
  name: string;

  /** The model class constructor. */
  modelClass: ModelClass<any>;

  /** The direct parent class, or null if the class extends Object. */
  superClass: ModelClass<any>;

  /** Subclasses registered as discriminator variants of this model. */
  discriminations: ModelClass<any>[] = [];

  /** Field-level decorator options keyed by field name. */
  fields: Ark7ModelFields;

  /**
   * Merged map of all fields (own + inherited + mixin). Built lazily by
   * {@link createCombinedFields} and used by `modelize()` and `toObject()`.
   */
  combinedFields: Map<string, CombinedModelField>;

  /** Global map tracking discriminator parent → child class relationships. */
  static discriminationsMap = new Map<ModelClass<any>, ModelClass<any>[]>();

  /**
   * Register a child class as a discriminator variant of a parent class.
   *
   * @param parentCls - The parent model class.
   * @param cls - The discriminator child class.
   */
  static addDiscriminations(parentCls: ModelClass<any>, cls: ModelClass<any>) {
    if (!this.discriminationsMap.has(parentCls)) {
      this.discriminationsMap.set(parentCls, []);
    }

    this.discriminationsMap.get(parentCls).push(cls);

    if (manager.hasMetadata(parentCls)) {
      manager.getMetadata(parentCls).discriminations.push(cls);
    }
  }

  /**
   * Returns all discriminator child classes registered for the given parent.
   */
  static getDiscriminations(cls: ModelClass<any>) {
    return this.discriminationsMap.get(cls) ?? [];
  }

  private _configs: ConfigOptions;

  /**
   * @param cls - The model class this metadata describes.
   * @param name - Optional registration name override.
   */
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

  /** The model's {@link ConfigOptions} (schema, defaultLevel, toObject, etc.). */
  get configs(): ConfigOptions {
    return this._configs;
  }

  /**
   * Sets the config and registers discriminator relationships with the
   * parent class if a `discriminatorKey` is present.
   */
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

  /** Whether this model is a customized type (extends {@link Converter}). */
  get isCustomizedType(): boolean {
    return this.modelClass.prototype instanceof Converter;
  }

  /** Whether this model is an enum type (extends {@link Enum}). */
  get isEnum(): boolean {
    return this.modelClass.prototype instanceof Enum;
  }

  /** The enum key-value mapping (only meaningful when {@link isEnum} is true). */
  get enums(): object {
    return (this.modelClass as any).enums;
  }

  /** Whether the enum's values are `'string'` or `'number'`. */
  get enumType(): 'string' | 'number' {
    const values = _.values(this.enums);

    return _.find(values, (v) => _.isNumber(v)) != null ? 'number' : 'string';
  }

  /** The enum's values, filtered to the detected {@link enumType}. */
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

  /**
   * Builds the {@link combinedFields} map by merging the model's own schema
   * properties, field decorator options, and prototype descriptors with those
   * inherited from superclasses and mixin classes.
   *
   * Called lazily by the {@link Manager} when metadata is first accessed.
   * The resulting map is ordered: superclass fields first, then own fields.
   *
   * @param manager - The global model manager used to resolve parent metadata.
   */
  createCombinedFields(manager: Manager) {
    d('createCombinedFields started.');
    const combinedFields = new Map();

    const nameSet = new Set<string>(); // Determines the prop orders.

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
        combinedFields.set(
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
        ...combinedFields.keys(),
        ...superMetadata.combinedFields.keys(),
      ]);

      for (const key of superMetadata.combinedFields.keys()) {
        nameSet.add(key);
      }

      for (const name of allNames) {
        const a = combinedFields.get(name);
        const b = superMetadata.combinedFields.get(name);

        if (a == null || b == null) {
          combinedFields.set(name, a ?? b);
        } else {
          combinedFields.set(name, a.merge(b));
        }
      }
    }

    for (const name of names) {
      nameSet.add(name);
    }

    this.combinedFields = new Map();

    for (const name of nameSet) {
      this.combinedFields.set(name, combinedFields.get(name));
    }

    d('createCombinedFields completed.');
  }

  /**
   * Returns all combined fields that have the specified tag.
   *
   * @param tag - The tag string to filter by.
   */
  getFieldsByTag(tag: string): CombinedModelField[] {
    return _.filter(Array.from(this.combinedFields.values()), (f) =>
      f.hasTag(tag),
    );
  }

  /**
   * Converts a model instance to a plain object, respecting data levels
   * and field-level serialization rules.
   *
   * Iterates over {@link combinedFields}, skipping methods and fields above
   * the requested data level, and recursively calls each field's `toObject`.
   *
   * @param obj - The model instance to serialize.
   * @param options - Serialization options (level, etc.).
   * @returns A plain JavaScript object.
   */
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

/**
 * Namespace providing static helper methods for interacting with the A7Model
 * system at runtime.
 */
export namespace A7Model {
  /**
   * Retrieves the {@link Ark7ModelMetadata} for a registered model, by class
   * reference or by name.
   *
   * @param model - The model class or registered name string.
   * @param options - Options (e.g. `forceFields` to ensure combinedFields
   *   are built).
   * @returns The metadata for the model.
   * @throws If the model is not registered.
   *
   * @example
   * ```typescript
   * const meta = A7Model.getMetadata(User);
   * const meta2 = A7Model.getMetadata('User');
   * ```
   */
  export function getMetadata<T>(
    model: string | ModelClass<T>,
    options?: GetMetadataOptions,
  ): Ark7ModelMetadata {
    return manager.getMetadata(model, options);
  }

  /**
   * Checks whether a model is registered in the A7Model system.
   *
   * @param name - The model class or registered name string.
   */
  export function hasMetadata<T>(name: string | ModelClass<T>): boolean {
    return manager.hasMetadata(name);
  }

  /**
   * Resets all registered model metadata. Primarily used in tests.
   */
  export function reset() {
    manager.reset();
  }

  /**
   * Programmatically register a model, enum, or customized type with the
   * A7Model system without using the `@A7Model` decorator.
   *
   * Useful for registering plain objects, enums, or third-party classes that
   * cannot be decorated directly.
   *
   * @example
   * ```typescript
   * // Register an enum
   * A7Model.provide(MyEnum);
   *
   * // Register a model class
   * A7Model.provide(MyModel);
   *
   * // Register a customized type with modelize/toObject
   * A7Model.provide<Date>({
   *   name: 'Date',
   *   modelize: (val) => new Date(val),
   *   toObject: (val) => val.toISOString(),
   * });
   * ```
   */
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

/**
 * Options for registering a customized type via {@link A7Model.provide}.
 *
 * @typeParam T - The runtime type being registered (e.g. `Date`, `Moment`).
 */
export interface ProvideOptions<T> {
  /** Registration name for the type. */
  name?: string;
  /** Custom modelize function that converts raw input to an instance of T. */
  modelize?: (val: any, options: ModelizeOptions) => T;
  /** Custom serialization function for `toObject` / `toJSON`. */
  toObject?: (val: any, options: DocumentToObjectOptions) => any;
}

/**
 * Additional options for {@link A7Model.provide} that control protobuf
 * generation behavior.
 */
export interface CustomProvideOptions {
  /** Nest this type's protobuf message inside another message. */
  protoNestedIn?: string;
  /** Override the protobuf enum name. */
  protoEnumName?: string;
}
