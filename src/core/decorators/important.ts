import { Field } from '../fields';

/**
 * Mark the field as Important to avoid being override by the natural order
 *   Child Class > Mixin Class > Parent Class.
 */
export function Important(): PropertyDecorator {
  return Field<ImportantOptions>({ importance: 100 });
}

export interface ImportantOptions {
  importance?: number;
}
