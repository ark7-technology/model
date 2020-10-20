import { ModelClass } from './fields';

export function createEnumModelClass(_enums: any): ModelClass<any> {
  class Enum {
    static modelize(o: any): string {
      // TODO: validate o is part os _enums.
      return o;
    }
  }

  return Enum;
}
