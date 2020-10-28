import { ModelClass } from './fields';

export class Converter {}

export function converter<T>(options: ConverterOptions<T>) {}

export interface ConverterOptions<T> {
  type: T;
  name?: string;
  modelize?: (o: any) => T;
}
