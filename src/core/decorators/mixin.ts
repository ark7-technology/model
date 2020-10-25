import { Config } from '../configs';
import { ModelClass, OptionsResolver } from '../fields';
import { concatResolver } from '../resolvers';

/**
 * Mixin another class.
 */
export function Mixin(cls: ModelClass<any>): ClassDecorator {
  return Config<MixinOptions>({
    mixinClasses: [cls],
    resolver: concatResolver('mixinClasses'),
  });
}

export interface MixinOptions {
  mixinClasses: ModelClass<any>[];
  resolver: OptionsResolver<any>;
}
