import { Field } from '../fields';

export type MMap<T> = Map<string, T>;

/**
 * Set default value for a field.
 */
export function MMap<T>(type: T): PropertyDecorator {
  return Field<MMapOptions<T>>({
    type: Map,
    of: type,
  });
}

export interface MMapOptions<T> {
  type: typeof Map;
  of: T;
}
