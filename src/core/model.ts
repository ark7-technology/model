import _ from 'underscore';

import { A7Model } from './configs';
import { DocumentToObjectOptions } from './fields';

@A7Model({})
export class StrictModel {
  toJSON(options: DocumentToObjectOptions = {}): AsObject<this> {
    return this.toObject(options);
  }

  toObject(_options: DocumentToObjectOptions = {}): AsObject<this> {
    return toObject(this);
  }

  static modelize<T extends new (...args: any[]) => any>(
    this: T,
    o: AsObject<InstanceType<T>>,
  ): InstanceType<T> {
    const ret = _.clone(o);
    Object.setPrototypeOf(ret, this.prototype);
    return ret as any;
  }
}

@A7Model({})
export class Model extends StrictModel {
  _id?: string;
}

export type AsObject<T> = Omit<T, MethodKeys<T>>;

export type MethodKeys<T> = {
  [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];

export type keys = keyof AsObject<StrictModel>;

function toObject(obj: any): any {
  if (_.isFunction(obj)) {
    return null;
  }

  if (_.isArray(obj)) {
    return _.map(obj, toObject);
  }

  if (obj instanceof Map) {
    return _.chain(Array.from(obj.entries()))
      .object()
      .mapObject(toObject)
      .value();
  }

  return _.isObject(obj) ? _.mapObject(obj, toObject) : obj;
}
