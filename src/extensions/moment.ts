import * as _ from 'underscore';
import * as moment from 'moment';
import { Duration, Moment } from 'moment';

import { A7Model, CombinedModelField, ModelizeOptions } from '../core';

A7Model.provide<Moment>({
  modelize: (x: any, options: ModelizeOptions) =>
    x == null
      ? x
      : options.field?.field?.tz === 'UTC'
      ? moment.utc(x)
      : moment(x),
  toObject: (x: Moment, field: CombinedModelField) => {
    return x == null
      ? x
      : field.field?.tz === 'UTC'
      ? x.toISOString()
      : x.toDate().toString();
  },
});

A7Model.provide<Duration>({
  modelize: (x: any) => (x == null ? x : moment.duration(x)),
  toObject: (x: Duration) => {
    return x == null ? x : _.isString(x) ? x : x.toISOString && x.toISOString();
  },
});
