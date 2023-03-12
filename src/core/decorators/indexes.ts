import * as _ from 'underscore';

import { Config } from '../configs';
import { Field } from '../fields';
import { concatResolver } from '../resolvers';

/**
 * Create an index on current field.
 *
 * @param options.index Enable current field index.
 * @param options.unique Indicate it's a unique index.
 * @param options.sparse Indicate it could be nullable.
 * @param options.indexDisabled Disable all current and nested field indexes.
 */
export function Index(options: Partial<IndexOptions> = {}): PropertyDecorator {
  return Field<IndexOptions>(
    _.extend(
      {
        index: true,
      },
      options,
      options.indexDisabled && !options.index ? { index: false } : {},
    ),
  );
}

/**
 * Indicate a field is unique.
 *
 * @param options.unique Indicate it's a unique index.
 * @param options.sparse Indicate it could be nullable.
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

  /**
   * Disable current and all nested indexes.
   */
  indexDisabled?: boolean;
}

export interface CompoundIndexOptionsFields {
  [key: string]: number | 'text' | 'hashed';
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
