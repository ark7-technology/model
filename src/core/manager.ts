import _ from 'underscore';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import { Ark7ModelMetadata } from './configs';
import { ModelClass } from './fields';

export class Manager {
  private metadataMap: Map<string, Ark7ModelMetadata> = new Map();

  constructor() {}

  reset() {
    this.metadataMap.clear();
  }

  getMetadata<T>(name: string | ModelClass<T>): Ark7ModelMetadata {
    const key = _.isString(name) ? name : name.name;
    const metadata = this.metadataMap.get(key);

    if (metadata == null) {
      throw new Error(`Metadata ${key} not set`);
    }

    if (metadata.configs == null) {
      metadata.configs =
        Reflect.getMetadata(A7_MODEL_CONFIG, metadata.modelClass) || {};
    }

    if (metadata.fields == null) {
      metadata.fields =
        (metadata.modelClass.prototype
          ? Reflect.getMetadata(A7_MODEL_FIELD, metadata.modelClass.prototype)
          : {}) || {};
    }

    return metadata;
  }

  register<T>(name: string, modelClass: ModelClass<T>) {
    const superClass = modelClass?.prototype?.__proto__?.constructor;
    this.metadataMap.set(name, {
      name,
      modelClass,
      superClass:
        superClass != null && superClass !== Object.prototype.constructor
          ? superClass
          : null,
    });
  }
}

export const manager = new Manager();
