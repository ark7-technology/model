import { Field } from '../fields';

/**
 * Indicate a readonly field.
 */
export function Readonly(options: boolean = true): PropertyDecorator {
  return Field<ReadonlyOptions>({
    readonly: options,
  });
}

/**
 * Indicate an autogen field.
 */
export function Autogen(): PropertyDecorator {
  return Field<ReadonlyOptions>({
    readonly: true,
    autogen: true,
  });
}

export interface ReadonlyOptions {
  readonly: boolean;
  autogen?: boolean;
}
