import * as _ from 'underscore';

import { Config } from '../configs';
import { Field } from '../fields';
import { concatResolver } from '../resolvers';

/**
 * Indicate a field has an index.
 */
export function Index(options: Partial<IndexOptions> = {}): PropertyDecorator {
  return Field<IndexOptions>(
    _.extend(
      {
        index: true,
      },
      options,
    ),
  );
}

/**
 * Indicate a field is unique.
 */
export function Unique(
  options: { unique?: boolean; sparse?: boolean } = {},
): PropertyDecorator {
  return Field<IndexOptions>(
    _.extend(
      {
        index: true,
        unique: true,
      },
      options,
    ),
  );
}

export interface IndexOptions {
  index: boolean;
  unique?: boolean;
  sparse?: boolean;
}

export interface CompoundIndexOptionsFields {
  [key: string]: number | 'text';
}

export interface CompoundIndexOptionsOptions {
  expires?: string;
  [other: string]: any;
}

export interface CompoundIndexOptions {
  indexes?: Array<{
    fields: CompoundIndexOptionsFields;
    options?: CompoundIndexOptionsOptions;
  }>;
}

export function CompoundIndex(
  fields: CompoundIndexOptionsFields,
  options?: CompoundIndexOptionsOptions,
): ClassDecorator {
  const o: any = { fields };
  if (options != null) {
    o.options = options;
  }
  return Config<CompoundIndexOptions>({
    indexes: [o],
    resolver: concatResolver('indexes'),
  });
}
