import 'should';

import { A7Model, StrictModel, Tag } from '../src';

describe('default', () => {
  @A7Model({})
  class BaseTagModel extends StrictModel {
    @Tag('tag11') field1?: string;
  }

  @A7Model({})
  class TagModel extends BaseTagModel {
    @Tag('tag1') field1?: string;
    @Tag(['tag2', 'tag3']) field2?: string;
  }

  describe('.modelize', () => {
    it('sets default value', () => {
      const field1 = A7Model.getMetadata(TagModel).combinedFields.get('field1');
      const field2 = A7Model.getMetadata(TagModel).combinedFields.get('field2');
      field1.field.tags.should.be.deepEqual(['tag1']);
      field2.field.tags.should.be.deepEqual(['tag2', 'tag3']);

      field1.hasTag('tag1').should.be.true();

      A7Model.getMetadata(TagModel)
        .getFieldsByTag('tag3')
        .should.have.length(1);
    });
  });
});
