import * as _ from 'underscore';

import { OptionsResolver } from './fields';

export const DEFAULT_OPTIONS_RESOLVER: OptionsResolver = (
  baseOptions,
  options,
) => _.extend({}, baseOptions, options);

export const LATEST_OPTIONS_RESOLVER: OptionsResolver = (
  _baseOptions,
  options,
) => options;

export function concatResolver<T>(field: string): OptionsResolver<T> {
  return (baseOptions: any, options: any) => {
    const bF: any[] = baseOptions[field] || [];
    const nF: any[] = options[field] || [];
    return _.extend({}, baseOptions, options, {
      [field]: [...nF, ...bF],
    });
  };
}

export function reverseConcatResolver<T>(field: string): OptionsResolver<T> {
  return (baseOptions: any, options: any) => {
    const bF: any[] = baseOptions[field] || [];
    const nF: any[] = options[field] || [];
    return _.extend({}, baseOptions, options, {
      [field]: [...bF, ...nF],
    });
  };
}
