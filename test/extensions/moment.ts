import 'should';

import '../../src/extensions/moment';

import * as moment from 'moment';
import { Duration } from 'moment';

import { A7Model, StrictModel } from '../../src';

@A7Model({})
class MomentModel extends StrictModel {
  d1: Duration;
}

describe('extensions/moment', () => {
  it('should modelize duration', () => {
    const ins1 = MomentModel.modelize({
      d1: 'P2Y' as any,
    });

    moment.isDuration(ins1.d1).should.be.true();

    ins1.toJSON().should.be.deepEqual({
      d1: 'P2Y',
    });
  });
});
