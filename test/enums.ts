import 'should';

import { A7Model, Enum, StrictModel } from '../src';

export enum SAME_KEY_VALUE {
  K1 = 'K1',
  K2 = 'K2',
}
A7Model.provide(SAME_KEY_VALUE);

export enum DIFF_KEY_VALUE {
  K1 = 1,
  K2 = 2,
}
A7Model.provide(DIFF_KEY_VALUE);

@A7Model({})
class TestEnumModel extends StrictModel {
  e1?: SAME_KEY_VALUE;
  e2?: DIFF_KEY_VALUE;
  // e3?: SAME_KEY_VALUE.K2;
  // e4?: SAME_KEY_VALUE.K1 | SAME_KEY_VALUE.K2;
}

describe('enums', () => {
  describe('.getMetadata()', () => {
    it('should return right metadata for SAME_KEY_VALUE', () => {
      const metadata = A7Model.getMetadata('SAME_KEY_VALUE');
      metadata.should.have.properties({
        name: 'SAME_KEY_VALUE',
        superClass: Enum.prototype.constructor,
        configs: {
          schema: {
            name: 'SAME_KEY_VALUE',
            props: [],
            fileName: process.cwd() + '/test/enums.ts',
          },
        },
        fields: {},
      });

      metadata.isEnum.should.be.true();
      metadata.enums.should.not.be.null();
      metadata.enumType.should.be.equal('string');
      metadata.enumValues.should.be.deepEqual(['K1', 'K2']);

      metadata.classes.should.have.length(2);
    });
  });

  describe('.modelize()', () => {
    it('should be able to parse', () => {
      const ins = TestEnumModel.modelize({
        e1: SAME_KEY_VALUE.K1,
        e2: DIFF_KEY_VALUE.K1,
      });

      ins.toObject().should.be.deepEqual({
        e1: SAME_KEY_VALUE.K1,
        e2: DIFF_KEY_VALUE.K1,
      });
    });
  });
});
