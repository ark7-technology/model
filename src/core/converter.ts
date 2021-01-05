import * as _ from 'underscore';

import {
  CombinedModelField,
  DocumentToObjectOptions,
  ModelClass,
  ModelizeOptions,
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
        return options.toObject(
          o,
          _.extend(
            {
              field,
              manager,
            },
            opt,
          ),
        );
      } else {
        return o;
      }
    }

    static modelize(o: any, opts: ModelizeOptions = {}): any {
      return options.modelize(o, opts);
    }
  }

  return MConverter;
}
