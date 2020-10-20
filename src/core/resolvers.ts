import _ from 'underscore';

import { OptionsResolver } from './fields';

export const DEFAULT_OPTIONS_RESOLVER: OptionsResolver = (
  baseOptions,
  options,
) => _.extend({}, baseOptions, options);

export const LATEST_OPTIONS_RESOLVER: OptionsResolver = (
  _baseOptions,
  options,
) => options;

export function concatResolver(field: string): OptionsResolver {
  return (baseOptions: any, options: any) => {
    const bF: any[] = baseOptions[field] || [];
    const nF: any[] = options[field] || [];
    return _.extend({}, baseOptions, options, {
      [field]: [...nF, ...bF],
    });
  };
}
