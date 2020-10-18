import 'should';

import {
  A7Model,
  Basic,
  DefaultDataLevel,
  Detail,
  Ref,
  Short,
  StrictModel,
} from '../src';

describe('model', () => {
  @A7Model({})
  class TestModelEmbedModel extends StrictModel {
    @Basic() field1: string;
    @Short() field2: string;
    @Detail() field3: string;
  }

  @A7Model({})
  class TestModelReferenceModel extends StrictModel {
    @Basic() field1: string;
    @Short() field2: string;
    @Detail() field3: string;
  }

  @A7Model({})
  class TestModelModel1 extends StrictModel {
    @Basic() field1: string;
    @Short() field2: string;
    @Detail() field3: string;

    embedded?: TestModelEmbedModel;

    ref?: Ref<TestModelReferenceModel>;

    refs?: Ref<TestModelReferenceModel>[];
  }

  const ins = TestModelModel1.modelize({
    field1: '1',
    field2: '2',
    field3: '3',
  });

  describe('#modelize', () => {
    it('creates an instance of model', () => {
      ins.should.be.instanceof(TestModelModel1);
    });
  });

  describe('.toObject', () => {
    it('returns POJO instance', () => {
      ins.toObject().should.not.be.instanceof(TestModelModel1);
    });

    it('returns on different level', () => {
      ins
        .toObject({ level: DefaultDataLevel.BASIC })
        .should.have.keys('field1');

      // ins
      // .toObject({ level: DefaultDataLevel.BASIC })
      // .should.not.have.keys('field2', 'field3');
    });
  });
});
