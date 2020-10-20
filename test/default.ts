import 'should';

import { A7Model, Default, StrictModel } from '../src';

describe('default', () => {
  @A7Model({})
  class DefaultModel extends StrictModel {
    @Default('value1') level1?: string;
    @Default(() => 'value2') level2?: string;
  }

  describe('.modelize', () => {
    it('sets default value', () => {
      DefaultModel.modelize({}).toObject().should.be.deepEqual({
        level1: 'value1',
        level2: 'value2',
      });
    });
  });
});
