import * as _ from 'underscore';
import * as debug from 'debug';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import { Ark7ModelMetadata } from './configs';
import { MetadataError } from './errors';
import { ModelClass } from './fields';

const d = debug('ark7:model:Manager');

export class Manager {
  // metadataMap is case insensitive.
  private metadataMap: Map<string, Ark7ModelMetadata> = new Map();

  constructor() {
    d('Manager instance created.');
  }

  reset() {
    d('Manager instance reset.');
    this.metadataMap.clear();
  }

  hasMetadata<T>(name: string | ModelClass<T>): boolean {
    const key = (_.isString(name) ? name : name.name).toLowerCase();
    return this.metadataMap.has(key);
  }

  getMetadata<T>(name: string | ModelClass<T>): Ark7ModelMetadata {
    const key = (_.isString(name) ? name : name.name).toLowerCase();
    const metadata = this.metadataMap.get(key);

    if (metadata == null) {
      d('model %O not set (%O).', name, this.metadataMap.size);
      throw new MetadataError(key);
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

    d('register model %O (%O).', name, this.metadataMap.size);
  }
}

export const manager = new Manager();
