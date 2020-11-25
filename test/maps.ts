import 'should';

import { A7Model, MMap, StrictModel } from '../src';

@A7Model({})
class TestMapModel2 extends StrictModel {
  foo: string;
}

@A7Model({})
class TestMapModel extends StrictModel {
  f1: MMap<TestMapModel2>;
  f2: MMap<number>;
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
                type: {
                  selfType: 'MMap',
                  typeArgumentType: { referenceName: 'TestMapModel2' },
                },
              },
              {
                name: 'f2',
                optional: false,
                modifier: 'PUBLIC',
                type: { selfType: 'MMap', typeArgumentType: 'number' },
              },
            ],
          },
        },
        fields: {},
      });
    });
  });

  describe('.modelize()', () => {
    it('should modelize map fields', () => {
      const ins = TestMapModel.modelize({
        f1: {
          f: { foo: 'f1' },
        },
        f2: {
          n: 2,
        },
      });

      ins.f1.should.be.instanceof(Map);
      ins.f1.get('f').should.be.instanceof(TestMapModel2);
      ins.f1.get('f').foo.should.be.eql('f1');

      ins.f2.should.be.instanceof(Map);
      ins.f2.get('n').should.be.instanceof(Number);
      ins.f2.get('n').should.be.eql(2);

      ins.toJSON().should.be.deepEqual({
        f1: {
          f: { foo: 'f1' },
        },
        f2: {
          n: 2,
        },
      });
    });
  });
});
