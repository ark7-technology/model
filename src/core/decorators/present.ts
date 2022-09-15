import { Field } from '../fields';

/**
 * Indicate a field is present or conditional present according to the current
 * model instance.
 */
export function Present(
  options: boolean | (() => boolean) = true,
): PropertyDecorator {
  return Field<PresentOptions>({
    present: options,
  });
}

export interface PresentOptions {
  present: boolean | (() => boolean);
}
