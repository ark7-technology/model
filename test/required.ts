import 'should';

import { A7Model, Required } from '../src';

describe('required', () => {
  function required(this: RequiredModel) {
    return this.field1 != null;
  }

  @A7Model({})
  class RequiredModel {
    @Required() field1: string;
    @Required(false) field2: string;
    @Required(required)
    field3: string;
  }

  it('specifies the required', () => {
    A7Model.getMetadata(RequiredModel).should.have.properties({
      name: 'RequiredModel',
      modelClass: RequiredModel.prototype.constructor,
      superClass: null,
      configs: {
        schema: {
          name: 'RequiredModel',
          props: [
            {
              name: 'field1',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
            },
            {
              name: 'field2',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
            },
            {
              name: 'field3',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
            },
          ],
          fileName: 'test/required.ts',
        },
      },
      fields: {
        field1: { name: 'field1', options: { required: true } },
        field2: { name: 'field2', options: { required: false } },
        field3: { name: 'field3', options: { required } },
      },
    });
  });
});
