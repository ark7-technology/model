import * as _ from 'underscore';
import * as debug from 'debug';

import { manager as _manager } from './manager';
import { A7Model } from './configs';
import { AsObject } from './types';
import { Basic, Proto } from './decorators';
import { DefaultDataLevel } from './levels';
import { DocumentToObjectOptions, ModelizeOptions } from './fields';
import { ModelizeError } from './errors';
import { runtime } from '../runtime';

const d = debug('ark7:model:StrictModel');

@A7Model({})
export class StrictModel {
  constructor() {
    throw new Error(
      'Do not use this constructor, use Class.modelize() instead.',
    );
  }

  static $metadata() {
    return _manager.getMetadata(this);
  }

  $attach?<T>(data?: T): Attachment<T> {
    d('StrictModel.$attach(%o)', data);

    const proto = (this as any).__proto__;

    if (data == null) {
      return proto.__$attach ? _.clone(proto) : null;
    }

    if (proto.__$attach) {
      _.extend(proto, data);

      return _.clone(proto);
    } else {
      const nProto = _.extend({ __$attach: true }, data);
      Object.setPrototypeOf(this, nProto);
      Object.setPrototypeOf(nProto, proto);

      return _.clone(nProto);
    }
  }

  toJSON(options: DocumentToObjectOptions = {}): AsObject<this> {
    d('StrictModel.toJSON(%o)', options);

    const ret: any = {};
    const metadata = A7Model.getMetadata((this as any).__proto__.constructor);

    const level = options.level ?? DefaultDataLevel.NEVER - 1;

    for (const name of metadata.combinedFields.keys()) {
      const field = metadata.combinedFields.get(name);
      if (field.isMethod) {
        continue;
      }

      if (field.level > level) {
        continue;
      }

      const target = (this as any)[name];

      if (!_.isUndefined(target)) {
        ret[name] = field.toObject(target, options);
      }
    }
    return ret;
  }

  toObject?(options: DocumentToObjectOptions = {}): any {
    const metadata = A7Model.getMetadata((this as any).__proto__.constructor);
    return metadata.toObject(this, options);
  }

  static modelize<T extends new (...args: any[]) => any>(
    this: T,
    o: AsObject<InstanceType<T>>,
    options: ModelizeOptions = {},
  ): InstanceType<T> {
    // d('StrictModel.modelize(%o)', o);

    if (o == null) {
      // d('modelize return empty.');
      return o as any;
    }

    if (o instanceof this) {
      // d('modelize return this.');
      return o as any;
    }

    const manager = options.manager ?? _manager;

    const metadata = manager.getMetadata(this.prototype.constructor);

    // d('modelize(): got metadata');

    let ret: any = options.patchInstance ? o : _.clone(o);

    if (_.isString(ret) && options.allowReference) {
      ret = { _id: ret };
    }

    if (metadata.configs?.discriminatorKey) {
      if (options.patchInstance) {
        ret = _.clone(o);
      }

      const key = (o as any)[metadata.configs.discriminatorKey];
      if (key != null && key.toLowerCase() !== metadata.name.toLowerCase()) {
        const m = manager.getMetadata(key);
        // d('modelize return discrimination.');
        return (m.modelClass as any).modelize.call(m.modelClass, o, options);
      }

      if (key == null) {
        ret[metadata.configs.discriminatorKey] = metadata.name;
      }
    }

    const desc = Object.getOwnPropertyDescriptor(this.prototype, '$mixed');

    if (desc == null) {
      d('set $mixed prototype property.');
      Object.defineProperty(this.prototype, '$mixed', { value: true });

      for (const cls of metadata.classes.reverse()) {
        const ownProperties = Object.getOwnPropertyNames(this.prototype);
        const desc = _.omit(
          Object.getOwnPropertyDescriptors(cls.prototype),
          'constructor',
          '$mixed',
          '$attach',
          'toJSON',
          'toObject',
          ...ownProperties,
        );
        Object.defineProperties(this.prototype, desc);
      }
    }

    Object.setPrototypeOf(ret, this.prototype);

    if (!options.noSubFields) {
      for (const name of metadata.combinedFields.keys()) {
        const field = metadata.combinedFields.get(name);
        if (
          field.isMethod ||
          (field.isGetter && !field.isSetter) ||
          field.prop?.modifier === runtime.Modifier.PROTECTED ||
          field.prop?.modifier === runtime.Modifier.PRIVATE
        ) {
          continue;
        }

        try {
          const val = field.modelize(ret[name], {
            manager,
            meta: {
              $parent: ret,
              $path: name,
            },
            attachFieldMetadata: options.attachFieldMetadata,
            allowReference: options.allowReference,
          });

          if (!_.isUndefined(val)) {
            ret[name] = val;
          }
        } catch (error) {
          if (error instanceof ModelizeError) {
            throw ModelizeError.fromNested(error, this, name);
          } else {
            throw new ModelizeError(name, this, error);
          }
        }
      }
    }

    if (options.attachFieldMetadata && (ret as StrictModel).$attach) {
      (ret as StrictModel).$attach(options.meta || {});
    }

    // d('modelize completed.');
    return ret as any;
  }
}

export interface ID {
  toString(): string;
}

let isIDFn: (x: any) => x is ID = ((x: any) => _.isString(x)) as any;

export function setIsIDFn(fn: (x: any) => x is ID) {
  isIDFn = fn;
}

export function isID(x: any): x is ID {
  return isIDFn(x);
}

@A7Model({})
export class Model extends StrictModel {
  @Basic()
  @Proto({ protoAssignedId: 1 })
  _id?: ID;
}

export type Attachment<T = object> = T & {
  __$attach: true;
};
