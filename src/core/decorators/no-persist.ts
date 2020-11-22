import { Field } from '../fields';

/**
 * Indicate a in-memory field.
 */
export function NoPersist(): PropertyDecorator {
  return Field<NoPersistOptions>({
    noPersist: true,
  });
}

export interface NoPersistOptions {
  noPersist: boolean;
}
