import * as _ from 'underscore';

import { Config } from '../configs';
import { ModelClass, OptionsResolver } from '../fields';
import { reverseConcatResolver } from '../resolvers';

/**
 * Mixin another class.
 */
export function Mixin(cls: ModelClass<any>): ClassDecorator {
  if (_.isEmpty(cls) && !_.isFunction(cls)) {
    throw new Error(`Mixin empty value!`);
  }
  return Config<MixinOptions>({
    mixinClasses: [cls],
    resolver: reverseConcatResolver('mixinClasses'),
  });
}

export interface MixinOptions {
  mixinClasses: ModelClass<any>[];
  resolver: OptionsResolver<any>;
}
