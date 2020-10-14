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
