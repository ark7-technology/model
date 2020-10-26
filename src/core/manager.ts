import _ from 'underscore';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import { Ark7ModelMetadata } from './configs';
import { ModelClass } from './fields';

export class Manager {
  // metadataMap is case insensitive.
  private metadataMap: Map<string, Ark7ModelMetadata> = new Map();

  constructor() {}

  reset() {
    this.metadataMap.clear();
  }

  getMetadata<T>(name: string | ModelClass<T>): Ark7ModelMetadata {
    const key = (_.isString(name) ? name : name.name).toLowerCase();
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

    metadata.createCombinedFields(this);

    return metadata;
  }

  register<T>(name: string, modelClass: ModelClass<T>) {
    const lower = name.toLowerCase();
    if (this.metadataMap.has(lower)) {
      throw new Error(`Model ${name} has already been registered.`);
    }

    this.metadataMap.set(lower, new Ark7ModelMetadata(modelClass, name));
  }
}

export const manager = new Manager();
