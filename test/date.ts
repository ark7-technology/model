import 'should';

import * as moment from 'moment';
import { Moment } from 'moment';

import {
  A7Model,
  DocumentToObjectOptions,
  Field,
  Model,
  ModelizeOptions,
} from '../src';

A7Model.provide<Moment>({
  modelize: (x: any, options: ModelizeOptions) => {
    return options.field?.field?.tz === 'UTC' ? moment.utc(x) : moment(x);
  },
  toObject: (x: Moment, options: DocumentToObjectOptions) => {
    return options.field.field?.tz === 'UTC'
      ? x.toISOString()
      : x.toDate().toString();
  },
});

namespace models {
  @A7Model({})
  export class TestData extends Model {
    d: Date;
    @Field({ tz: 'UTC' }) m: Moment;
    m2: Moment;
  }
}

describe('date', () => {
  it('parses date string value', () => {
    const d = new Date();
    const str = d.toISOString();
    const v = models.TestData.modelize({ d: str, m: str, m2: str });

    v.toObject().should.be.deepEqual({ d, m: str, m2: d.toString() });
  });
});
