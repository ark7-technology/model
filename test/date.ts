import 'should';

import { A7Model, Model } from '../src';

// import moment, { Moment } from 'moment';


// A7Model.provide<Moment>({
// modelize: (x: any) => moment.utc(x),
// });

namespace models {
  @A7Model({})
  export class TestData extends Model {
    d: Date;
    // m: Moment;
  }
}

describe('date', () => {
  it('parses date string value', () => {
    const d = new Date();
    const str = d.toISOString();
    const v = models.TestData.modelize({ d: str });

    v.toJSON().should.be.deepEqual({ d });
  });
});
