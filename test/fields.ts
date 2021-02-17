import * as should from 'should';

import { A7Model, Field, StrictModel } from '../src';

describe('fields', () => {
  @A7Model({})
  class FieldEmbeddedModel extends StrictModel {
    get foo() {
      return 'bar';
    }
  }

  @A7Model({})
  class FieldTestModel extends StrictModel {}

  interface FieldTestModel2 {
    foo?: FieldEmbeddedModel;
  }

  interface FieldTestModel extends FieldTestModel2 {}

  Field({ default: () => ({}), model: FieldEmbeddedModel })(
    FieldTestModel.prototype,
    'foo',
  );

  it('should return proper metadata', () => {
    const foo = A7Model.getMetadata(FieldTestModel).combinedFields.get('foo');

    should(foo.prop).be.undefined();

    foo.field.default.should.not.be.null();

    const m = FieldTestModel.modelize({});

    m.foo.should.be.instanceof(FieldEmbeddedModel);
  });
});
