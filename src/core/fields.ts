import 'reflect-metadata';

import * as _ from 'underscore';

import { A7_MODEL_FIELD } from './tokens';
import {
  CompoundIndexOptionsFields,
  CompoundIndexOptionsOptions,
  LevelOptions,
  PresentOptions,
  RequiredOptions,
} from './decorators';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { DefaultDataLevel } from './levels';
import { Manager, manager as _manager } from './manager';
import { ModelizeError } from './errors';
import { StrictModel } from './model';
import { runtime } from '../runtime';

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

export function getArk7ModelField<T>(target: ModelClass<T>): Ark7ModelFields {
  return Reflect.getMetadata(A7_MODEL_FIELD, target.prototype) || {};
}

export interface ModelClass<T> {
  new (...args: any[]): T;
  $modelClassName?: string;
  $discriminatorKey?: string;
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
  discriminatorKey?: string;
  resolver?: OptionsResolver<T>;
};

export type OptionsResolver<
  T = object,
  O extends BaseOptions<T> = BaseOptions<T>,
> = (baseOptions: O, options: O) => O;

export type FieldOptionsResolver<T = object> = OptionsResolver<FieldOptions<T>>;

export interface StrictFieldOption {
  type?: any;
  default?: any;
  level?: number;
  passLevelMap?: {
    [current: number]: number;
  };
  readonly?: boolean;
  autogen?: boolean;
  tags?: string[];

  /** Virtual fields */
  ref?: string | ModelClass<any>;
  localField?: string;
  foreignField?: string;
  justOne?: boolean;
  options?: any;
  count?: boolean;
  match?: object;

  noPersist?: boolean;

  getter?: boolean;
  setter?: boolean;

  manual?: boolean; // Manually set the current field.
}

export type FieldOptions<T = StrictFieldOption> = BaseOptions<
  T & StrictFieldOption
>;

export type ConfigOptionsResolver<T = StrictConfigOptions> = OptionsResolver<
  ConfigOptions<T>
>;

export interface StrictConfigOptions {
  schema?: runtime.Schema;
  defaultLevel?: number;
  toObject?: DocumentToObjectOptions;
  toJSON?: DocumentToObjectOptions;
  discriminatorKey?: string;
  indexes?: Array<{
    fields: CompoundIndexOptionsFields;
    options?: CompoundIndexOptionsOptions;
  }>;
  mixinClasses?: ModelClass<any>[];
  protoNestedIn?: string;
  protoMessageName?: string;
}

export type ConfigOptions<T = StrictConfigOptions> = BaseOptions<
  T & StrictConfigOptions
>;

export interface ModelizeMetadata {
  $parent?: any;
  $path?: string;
  $isArray?: boolean;
  $index?: number;
}

export interface ModelizeOptions {
  attachFieldMetadata?: boolean;
  manager?: Manager;
  meta?: ModelizeMetadata;
  field?: CombinedModelField;

  // Whether to allow a mongodb-style id reference. For example,
  //   { user: '58a606de-d0f3-495a-a36a-da5da8ea68de' } might be translated to
  //   { user: { _id: '58a606de-d0f3-495a-a36a-da5da8ea68de' } } based on the
  //   User schema.
  allowReference?: boolean;

  /**
   * Patch instance directly for better performance.
   */
  patchInstance?: boolean;

  noSubFields?: boolean;
}

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
  /** model field */
  field?: CombinedModelField;
  manager?: Manager;
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
    public field: FieldOptions<any> = null,
    public source: ModelClass<any> = null,
  ) {}

  merge(b: CombinedModelField): CombinedModelField {
    if (
      b?.field?.importance != null &&
      (this.field?.importance == null ||
        b.field.importance > this.field.importance)
    ) {
      return b.merge(this);
    }

    return new CombinedModelField(
      this.name,
      this.prop ?? b.prop,
      this.descriptor ?? b.descriptor,
      this.field ?? b.field,
      this.source ?? b.source,
    );
  }

  get isID(): boolean {
    return (
      runtime.isReferenceType(this.prop?.type) &&
      this.prop.type.referenceName === 'ID'
    );
  }

  get isDate(): boolean {
    if (this.field?.type != null) {
      return this.field.type === Date;
    } else if (runtime.isReferenceType(this.prop?.type)) {
      return this.prop.type.referenceName === 'Date';
    }

    return false;
  }

  get level(): number {
    const level = (this.field as LevelOptions)?.level;

    return this.isGetter ? level ?? DefaultDataLevel.NEVER : level;
  }

  get isGetter(): boolean {
    return this.field?.getter ?? this.prop?.getter;
  }

  get isSetter(): boolean {
    return this.field?.setter ?? this.prop?.setter;
  }

  get isMethod(): boolean {
    return this.prop?.type === 'method';
  }

  get isVirtualReference(): boolean {
    return (
      this.field != null &&
      this.field.ref != null &&
      this.field.localField != null &&
      this.field.foreignField != null
    );
  }

  get isArray(): boolean {
    return runtime.isArrayType(this.prop?.type);
  }

  get isIDArray(): boolean {
    return (
      runtime.isArrayType(this.prop?.type) &&
      runtime.isReferenceType(this.prop.type.arrayElementType) &&
      this.prop.type.arrayElementType.referenceName === 'ID'
    );
  }

  get isDateArray(): boolean {
    return (
      runtime.isArrayType(this.prop?.type) &&
      runtime.isReferenceType(this.prop.type.arrayElementType) &&
      this.prop.type.arrayElementType.referenceName === 'Date'
    );
  }

  get isMap(): boolean {
    return (
      runtime.isParameterizedType(this.prop?.type) &&
      this.prop?.type.selfType === 'MMap'
    );
  }

  /**
   * If the current field is a foreign Ref<Model>.
   */
  get isReference(): boolean {
    const type = this.isArray
      ? (this.prop?.type as runtime.ArrayType).arrayElementType
      : this.prop?.type;

    return runtime.isParameterizedType(type) && type?.selfType === 'Ref';
  }

  get type(): runtime.Type {
    const type = this.isArray
      ? (this.prop?.type as runtime.ArrayType).arrayElementType
      : this.prop?.type;

    return runtime.isParameterizedType(type) ? type?.typeArgumentType : type;
  }

  get hasNoTags(): boolean {
    return _.isEmpty(this.field?.tags);
  }

  hasTag(tag: string): boolean {
    return this.field?.tags?.includes(tag);
  }

  isPresent(val: any = {}): boolean {
    if ((this.field as PresentOptions)?.present != null) {
      const k = (this.field as PresentOptions)?.present;

      if (_.isBoolean(k)) {
        return k;
      }

      if (_.isFunction(k)) {
        return k.call(val);
      }
    }

    return true;
  }

  isRequired(val: any = {}): boolean {
    if ((this.field as RequiredOptions)?.required != null) {
      const k = (this.field as RequiredOptions)?.required;

      if (_.isBoolean(k)) {
        return k;
      }

      if (_.isFunction(k)) {
        return k.call(val);
      }
    }

    if (this.prop != null) {
      return !this.prop.optional;
    }

    return false;
  }

  modelize(o: any, options: ModelizeOptions = {}): any {
    // d('CombinedModelField.modelize(%o)', o);

    const manager = options.manager ?? _manager;
    const fieldType = this.field?.type;

    if (_.isUndefined(o) && !this.prop?.optional) {
      switch (this.prop?.type) {
        case 'string':
          return '';
        case 'number':
          return 0;
      }
    }

    if (_.isUndefined(o) && !_.isUndefined(this.field?.default)) {
      o = _.isFunction(this.field.default)
        ? this.field.default()
        : this.field.default;
    }

    if (this.isID) {
      return o;
    }

    if (fieldType === String) {
      return new String(o);
    }

    if (_.isFunction(fieldType)) {
      return (fieldType as Function)(o);
    }

    if (this.prop == null) {
      return this.field.model
        ? this.field.model.modelize(o, {
            manager,
            meta: {
              $parent: options.meta?.$parent,
              $path: options.meta?.$path,
            },
            attachFieldMetadata: options.attachFieldMetadata,
            field: this,
            allowReference: options.allowReference,
            patchInstance: options.patchInstance,
          })
        : o;
    }

    const propType = this.type;
    const field = this;

    function modelizeField(type: runtime.Type, val: any, idx?: number): any {
      if (runtime.isReferenceType(type)) {
        const metadata = manager.getMetadata(type.referenceName);

        const meta: ModelizeMetadata = {
          $parent: options.meta?.$parent,
          $path: options.meta?.$path,
          $isArray: idx != null,
        };
        if (idx != null) {
          meta.$index = idx;
        }

        try {
          return (metadata.modelClass as typeof StrictModel).modelize(val, {
            manager,
            meta,
            attachFieldMetadata: options.attachFieldMetadata,
            field,
            allowReference: options.allowReference,
            patchInstance: options.patchInstance,
          });
        } catch (error) {
          if (error instanceof ModelizeError) {
            throw error;
          } else {
            throw new ModelizeError(field.name, field, error);
          }
        }
      }

      return val;
    }

    function map(val: any, idx?: number): any {
      if (runtime.isParameterizedType(field.prop.type)) {
        const p = field.prop.type.typeArgumentType;
        switch (field.prop.type.selfType) {
          case 'MMap':
            const entries = _.chain(
              val instanceof Map ? Array.from(val.entries()) : _.pairs(val),
            )
              .map(([key, val]) => [key, modelizeField(p, val)])
              .value();
            return new Map(entries as any);

          case 'Ref':
            if (_.isString(val) && !options.allowReference) {
              return val;
            }

            if (_.isString(val) && options.allowReference) {
              return modelizeField(propType, { _id: val }, idx);
            }

            return modelizeField(propType, val, idx);
        }

        return val;
      }

      return modelizeField(propType, val, idx);
    }

    return this.isArray ? _.map(o, map) : map(o);
  }

  toObject(o: any, options: DocumentToObjectOptions): any {
    const manager = options.manager ?? _manager;
    const propType = this.type;

    const newOptions = _.clone(options);

    if (options.level != null) {
      newOptions.level =
        (this.field?.passLevelMap && this.field?.passLevelMap[options.level]) ||
        options.level;
    }

    const map = (val: any): any => {
      if (runtime.isReferenceType(propType)) {
        if (manager.hasMetadata(propType.referenceName)) {
          const metadata = manager.getMetadata(propType.referenceName);

          if (metadata.isCustomizedType) {
            return (metadata.modelClass as any).toObject(
              val,
              this,
              options,
              manager,
            );
          }

          if (metadata.isEnum) {
            return val;
          }

          return metadata.toObject(val, newOptions);
        }
        const c = val as StrictModel;
        return c.toObject ? c.toObject(newOptions) : c;
      }

      return val;
    };

    return this.isMap
      ? _.chain(Array.from(o.entries()))
          .map(([key, val]) => [key, map(val)])
          .object()
          .value()
      : this.isArray
      ? _.map(o, map)
      : map(o);
  }
}
