import _ from 'underscore';

import { Field } from '../fields';

export type Ref<M> = string | M;

/**
 * Set a reference field.
 */
export function Reference(options: ReferenceOptions = {}): PropertyDecorator {
  return Field<ReferenceOptionsMetadata>(
    _.defaults(
      {
        reference: true,
      },
      options,
    ),
  );
}

export interface ReferenceOptions {
  model?: string;
  isArray?: boolean;
}

export interface ReferenceOptionsMetadata extends ReferenceOptions {
  reference: true;
}
