import 'reflect-metadata';

import _ from 'underscore';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import {
  CompoundIndexOptionsFields,
  CompoundIndexOptionsOptions,
} from './decorators';
import { DEFAULT_OPTIONS_RESOLVER } from './resolvers';
import { Manager, manager as _manager } from './manager';
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
  T = object,
  O extends BaseOptions<T> = BaseOptions<T>
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

  /** Virtual fields */
  ref?: string | ModelClass<any>;
  localField?: string;
  foreignField?: string;
  justOne?: boolean;
  options?: any;
  count?: boolean;
  match?: object;
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
  ) {}

  merge(b: CombinedModelField): CombinedModelField {
    return new CombinedModelField(
      this.name,
      this.prop ?? b.prop,
      this.descriptor ?? b.descriptor,
      this.field ?? b.field,
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
    return runtime.isArrayType(this.prop.type);
  }

  get isReference(): boolean {
    const type = this.isArray
      ? (this.prop.type as runtime.ArrayType).arrayElementType
      : this.prop.type;

    return runtime.isParameterizedType(type) && type.selfType === 'Ref';
  }

  get type(): runtime.Type {
    const type = this.isArray
      ? (this.prop.type as runtime.ArrayType).arrayElementType
      : this.prop.type;

    return runtime.isParameterizedType(type) ? type.typeArgumentType : type;
  }

  modelize(o: any, options: ModelizeOptions = {}): any {
    const manager = options.manager ?? _manager;
    const fieldType = this.field?.type;

    if (_.isUndefined(o) && !_.isUndefined(this.field?.default)) {
      return _.isFunction(this.field.default)
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

    const propType = this.type;

    function map(val: any, idx?: number): any {
      if (runtime.isReferenceType(propType)) {
        const metadata = manager.getMetadata(propType.referenceName);

        const meta: ModelizeMetadata = {
          $parent: options.meta?.$parent,
          $path: options.meta?.$path,
          $isArray: idx != null,
        };
        if (idx != null) {
          meta.$index = idx;
        }

        return (metadata.modelClass as typeof StrictModel).modelize(val, {
          manager,
          meta,
          attachFieldMetadata: options.attachFieldMetadata,
        });
      }

      return val;
    }

    return this.isArray ? _.map(o, map) : map(o);
  }

  toObject(o: any, manager: Manager, options: DocumentToObjectOptions): any {
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

          return metadata.toObject(val, newOptions, manager);
        }
        const c = val as StrictModel;
        return c.toObject ? c.toObject(newOptions, manager) : c;
      }

      return val;
    };

    return this.isArray ? _.map(o, map) : map(o);
  }
}
