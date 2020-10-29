import {
  CombinedModelField,
  DocumentToObjectOptions,
  ModelClass,
} from './fields';
import { Manager } from './manager';
import { ProvideOptions } from './configs';

export class Converter {}

export function converter<T>(
  options: ProvideOptions<T>,
  _name: string,
): ModelClass<any> {
  class MConverter extends Converter {
    static toObject(
      o: any,
      field: CombinedModelField,
      opt: DocumentToObjectOptions,
      manager: Manager,
    ): any {
      if (options.toObject != null) {
        return options.toObject(o, field, opt, manager);
      } else {
        return o;
      }
    }

    static modelize(o: any, manager?: Manager): any {
      return options.modelize(o, manager);
    }
  }

  return MConverter;
}
