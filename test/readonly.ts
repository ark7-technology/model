import 'should';

import { A7Model, Readonly } from '../src';

describe('readonly', () => {
  @A7Model({})
  class ReadonlyModel {
    @Readonly() field1: string;
    @Readonly(false) field2: string;
  }

  it('specifies the readonly', () => {
    A7Model.getMetadata(ReadonlyModel).should.have.properties({
      name: 'ReadonlyModel',
      modelClass: ReadonlyModel.prototype.constructor,
      superClass: null,
      configs: {
        schema: {
          name: 'ReadonlyModel',
          props: [
            {
              name: 'field1',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
              readonly: false,
            },
            {
              name: 'field2',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
              readonly: false,
            },
          ],
        },
      },
      fields: {
        field2: { propertyName: 'field2', options: { readonly: false } },
        field1: { propertyName: 'field1', options: { readonly: true } },
      },
    });
  });
});
