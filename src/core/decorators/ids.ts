import { Field } from '../fields';

/**
 * Declare nested id fields.
 *
 * @param options.forceIdToString Force convert all ObjectId types to string.
 */
export function IDType(options: IDTypeOptions): PropertyDecorator {
  return Field<IDTypeOptions>(options);
}

export interface IDTypeOptions {
  forceIdToString?: boolean;
}
