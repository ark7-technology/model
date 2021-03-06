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

export function idOf<M>(x: Ref<M>, options: IdOfOptions = {}): ID {
  return x == null ? null : isID(x) ? x : (x as any)[options.idField ?? '_id'];
}

export interface IdOfOptions {
  idField?: string;
}

export function isSameModel<M>(m1: Ref<M>, m2: Ref<M>): boolean {
  const id1 = idOf(m1);
  const id2 = idOf(m2);

  return id1 != null && id2 != null && id1.toString() === id2.toString();
}
