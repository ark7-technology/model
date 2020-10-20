import _ from 'underscore';

import { A7Model } from './configs';
import { AsObject } from './types';
import { DocumentToObjectOptions } from './fields';
import { LevelOptions } from './decorators';
import { Manager, manager as _manager } from './manager';

@A7Model({})
export class StrictModel {
  $attach<T>(data?: T): Attachment<T> {
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
    return this.toObject(options);
  }

  toObject(
    options: DocumentToObjectOptions = {},
    manager?: Manager,
  ): AsObject<this> {
    manager = manager ?? _manager;

    const ret: any = {};
    const metadata = A7Model.getMetadata((this as any).__proto__.constructor);

    for (const name of metadata.combinedFields.keys()) {
      const field = metadata.combinedFields.get(name);
      if (field.isMethod) {
        continue;
      }

      if (
        options.level != null &&
        (field.field as LevelOptions)?.level > options.level
      ) {
        continue;
      }

      const target = (this as any)[name];

      if (!_.isUndefined(target)) {
        ret[name] = field.toObject(target, manager, options);
      }
    }
    return ret;
  }

  static modelize<T extends new (...args: any[]) => any>(
    this: T,
    o: AsObject<InstanceType<T>>,
    manager?: Manager,
  ): InstanceType<T> {
    manager = manager ?? _manager;

    const metadata = manager.getMetadata(this.prototype.constructor);

    const ret: any = _.clone(o);

    if (metadata.configs?.discriminatorKey) {
      const key = (o as any)[metadata.configs.discriminatorKey];
      if (key != null && key !== this.prototype.constructor.name) {
        const m = manager.getMetadata(key);
        return (m.modelClass as any).modelize.call(m.modelClass, o, manager);
      }

      if (key == null) {
        ret[
          metadata.configs.discriminatorKey
        ] = this.prototype.constructor.name;
      }
    }

    Object.setPrototypeOf(ret, this.prototype);

    for (const name of metadata.combinedFields.keys()) {
      const field = metadata.combinedFields.get(name);
      if (field.isMethod) {
        continue;
      }

      const val = field.modelize(ret[name], manager);
      if (!_.isUndefined(val)) {
        ret[name] = val;
      }
    }

    return ret as any;
  }
}

@A7Model({})
export class Model extends StrictModel {
  _id?: string;
}

export type Attachment<T = object> = T & {
  __$attach: true;
};
