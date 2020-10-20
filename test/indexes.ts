import 'should';

import { A7Model, CompoundIndex, Unique } from '../src';

describe('indexes', () => {
  @A7Model({})
  @CompoundIndex({ field1: -1, field2: 1 })
  @CompoundIndex({ field2: 1, field1: -1 })
  class IndexesModel {
    @Unique() field1: string;
    @Unique({ sparse: true }) field2: string;
  }

  it('specifies the readonly', () => {
    A7Model.getMetadata(IndexesModel).should.have.properties({
      name: 'IndexesModel',
      modelClass: IndexesModel.prototype.constructor,
      superClass: null,
      configs: {
        schema: {
          name: 'IndexesModel',
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
        indexes: [
          {
            fields: {
              field1: -1,
              field2: 1,
            },
          },
          {
            fields: {
              field2: 1,
              field1: -1,
            },
          },
        ],
      },
      fields: {
        field2: {
          name: 'field2',
          options: { unique: true, sparse: true, index: true },
        },
        field1: { name: 'field1', options: { unique: true, index: true } },
      },
    });
  });
});
