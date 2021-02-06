import { Config } from '../configs';
import { ModelClass, OptionsResolver } from '../fields';
import { reverseConcatResolver } from '../resolvers';

/**
 * Mixin another class.
 */
export function Mixin(cls: ModelClass<any>): ClassDecorator {
  return Config<MixinOptions>({
    mixinClasses: [cls],
    resolver: reverseConcatResolver('mixinClasses'),
  });
}

export interface MixinOptions {
  mixinClasses: ModelClass<any>[];
  resolver: OptionsResolver<any>;
}
