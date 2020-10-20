import { Field } from '../fields';

/**
 * Set default value for a field.
 */
export function Default<T>(options: T | (() => T)): PropertyDecorator {
  return Field<DefaultOptions>({
    default: options,
  });
}

export interface DefaultOptions {
  default: any;
}
