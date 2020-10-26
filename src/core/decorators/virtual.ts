import { Field, ModelClass } from '../fields';

/**
 * Indicate a virtual field that could be populated with other models.
 */
export function Virtual(options: VirtualOptions): PropertyDecorator {
  return Field<VirtualOptions>(options);
}

export interface VirtualOptions {
  ref: string | ModelClass<any>;
  localField: string;
  foreignField: string;
  justOne?: boolean;
  options?: any;
  count?: boolean;
  match?: object;
}
