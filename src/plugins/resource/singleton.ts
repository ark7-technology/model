import * as debug from 'debug';

import { A7Model, Model } from '../../core';
import { getResourceConfigs } from './types';

const d = debug('ark7:model:resource:singleton');

// --- Model.sGet ---

(Model as any).sGet = async function sGet(val?: any): Promise<any> {
  d('sGet() called on %s with val=%s', this.name, val);

  const { handler } = getResourceConfigs();

  if (handler == null || handler.findOne == null) {
    throw new Error(
      'ResourceHandler.findOne is not implemented. Call configureResource({ handler }) with findOne to enable singleton operations.',
    );
  }

  const metadata = A7Model.getMetadata(this);
  const singletonConfig = metadata.configs?.singleton;

  let query: object;

  if (typeof singletonConfig === 'string') {
    // Keyed singleton: sGet(val) → findOne({ [keyName]: val })
    query = val != null ? { [singletonConfig]: val } : {};
  } else {
    // Boolean singleton: sGet() → findOne({})
    query = {};
  }

  d('sGet() calling findOne with query=%o', query);

  const result = await handler.findOne(this, query);
  return this.modelize(result);
};

// --- Model.sUpdate ---

(Model as any).sUpdate = async function sUpdate(
  data: object,
  val?: any,
): Promise<any> {
  d('sUpdate() called on %s with data=%o, val=%s', this.name, data, val);

  const instance = await this.sGet(val);
  return instance.$update(data);
};
