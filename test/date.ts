import 'should';

import '../src/extensions/moment';

import { Moment } from 'moment';

import { A7Model, Field, Model } from '../src';

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

    v.toObject().should.be.deepEqual({ d, m: d.toString(), m2: d.toString() });
  });
});
