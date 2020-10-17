import { Field } from '../fields';

/**
 * Indicate a readonly field.
 */
export function Readonly(options: boolean = true): PropertyDecorator {
  return Field<ReadonlyOptions>({
    readonly: options,
  });
}

export interface ReadonlyOptions {
  readonly: boolean;
}
