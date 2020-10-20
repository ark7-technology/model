import { Field } from '../fields';

/**
 * Indicate a field is required or conditional required according to the current
 * model instance.
 */
export function Required(
  options: boolean | (() => boolean) = true,
): PropertyDecorator {
  return Field<RequiredOptions>({
    required: options,
  });
}

export interface RequiredOptions {
  required: boolean | (() => boolean);
}

/**
 * Indicate a field is optional.
 */
export function Optional(options: boolean = true): PropertyDecorator {
  return Field<RequiredOptions>({
    required: !options,
  });
}
