import * as debug from 'debug';

import { Model } from '../../core';
import { buildHandlerOptions, getResourceConfigs } from './types';

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

  const opts = buildHandlerOptions(this);

  let query: object;

  if (typeof opts.singleton === 'string') {
    // Keyed singleton: sGet(val) → findOne({ [keyName]: val })
    query = val != null ? { [opts.singleton]: val } : {};
  } else {
    // Boolean singleton: sGet() → findOne({})
    query = {};
  }

  d('sGet() calling findOne with query=%o', query);

  const result = await handler.findOne(opts, query);
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
