import { ModelClass } from './fields';

export class Enum {}

export function createEnumModelClass(_enums: any): ModelClass<any> {
  class MEnum extends Enum {
    static enums = _enums;

    static modelize(o: any): string {
      // TODO: validate o is part os _enums.
      return o;
    }
  }

  return MEnum;
}
