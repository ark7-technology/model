import * as debug from 'debug';

import { Model } from '../../core';
import { getResourceConfigs } from './types';

const d = debug('ark7:model:resource:crud');

function requireHandler(method: string) {
  const { handler } = getResourceConfigs();

  if (handler == null) {
    throw new Error(
      `No ResourceHandler configured. Call configureResource({ handler }) to enable ${method}.`,
    );
  }

  return handler;
}

// --- Model.create ---

(Model as any).create = async function create(data: object): Promise<any> {
  d('create() called on %s', this.name);

  const handler = requireHandler('create');

  if (handler.create == null) {
    throw new Error(
      'ResourceHandler.create is not implemented.',
    );
  }

  const result = await handler.create(this, data);
  return this.modelize(result);
};

// --- Model.get ---

(Model as any).get = async function get(id: any): Promise<any> {
  d('get() called on %s with id=%s', this.name, id);

  const handler = requireHandler('get');

  if (handler.get == null) {
    throw new Error(
      'ResourceHandler.get is not implemented.',
    );
  }

  const result = await handler.get(this, id);
  return this.modelize(result);
};

// --- Model.query ---

(Model as any).query = async function query(params?: object): Promise<any[]> {
  d('query() called on %s with params=%o', this.name, params);

  const handler = requireHandler('query');

  if (handler.query == null) {
    throw new Error(
      'ResourceHandler.query is not implemented.',
    );
  }

  const results = await handler.query(this, params);
  return results.map((r: any) => this.modelize(r));
};

// --- Model.remove ---

(Model as any).remove = async function remove(id: any): Promise<any> {
  d('remove() called on %s with id=%s', this.name, id);

  const handler = requireHandler('remove');

  const stub = this.modelize({ _id: id }, { noSubFields: true });
  return handler.remove(stub);
};
