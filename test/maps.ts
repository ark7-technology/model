import 'should';

import { A7Model, MMap, StrictModel } from '../src';

@A7Model({})
class TestMapModel extends StrictModel {
  f1: MMap<number>;
}

describe('maps', () => {
  describe('.getMetadata()', () => {
    it('should return right metadata for string-value map', () => {
      A7Model.getMetadata(TestMapModel).should.have.properties({
        name: 'TestMapModel',
        configs: {
          schema: {
            name: 'TestMapModel',
            props: [
              {
                name: 'f1',
                optional: false,
                modifier: 'PUBLIC',
                type: { selfType: 'MMap', typeArgumentType: 'number' },
                readonly: false,
              },
            ],
          },
        },
        fields: {},
      });
    });
  });
});
