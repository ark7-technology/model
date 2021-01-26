import * as _ from 'underscore';

import { Field } from '../fields';
import { ID, isID } from '../model';

export type Ref<M> = ID | M;

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

export function asModel<M>(x: Ref<M>): M {
  return x as M;
}

export const $$ = asModel;

export function isModel<M>(x: Ref<M>): x is M {
  return !isID(x);
}
