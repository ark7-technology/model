import _ from 'underscore';

import { A7Model } from './configs';
import { AsObject } from './types';
import { DocumentToObjectOptions } from './fields';
import { LevelOptions } from './decorators';
import { Manager, manager as _manager } from './manager';

@A7Model({})
export class StrictModel {
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
    const ret: any = _.clone(o);
    Object.setPrototypeOf(ret, this.prototype);

    const metadata = A7Model.getMetadata(this.prototype.constructor);

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
