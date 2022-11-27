import 'should';

import { A7Model, Ref, Reference, StrictModel, asModel } from '../src';

describe('reference', () => {
  @A7Model({})
  class ReferenceModelA extends StrictModel {
    fieldA1: string;
  }

  @A7Model({})
  class ReferenceModel extends StrictModel {
    @Reference()
    field1: Ref<ReferenceModelA>;

    @Reference({ model: 'ReferenceModelA' })
    field2: Ref<ReferenceModelA>[];
  }

  describe('asModel', () => {
    it('asset the value', () => {
      const x: Ref<number> = 123;

      asModel(x).toFixed().should.be.eql('123');
    });
  });

  it('specifies the required', () => {
    A7Model.getMetadata(ReferenceModel).should.have.properties({
      name: 'ReferenceModel',
      modelClass: ReferenceModel.prototype.constructor,
      configs: {
        schema: {
          name: 'ReferenceModel',
          props: [
            {
              name: 'field1',
              optional: false,
              modifier: 'PUBLIC',
              type: {
                selfType: 'Ref',
                typeArgumentType: {
                  referenceName: 'ReferenceModelA',
                },
              },
            },
            {
              name: 'field2',
              optional: false,
              modifier: 'PUBLIC',
              type: {
                arrayElementType: {
                  selfType: 'Ref',
                  typeArgumentType: {
                    referenceName: 'ReferenceModelA',
                  },
                },
              },
            },
          ],
          fileName: 'test/reference.ts',
        },
      },
      fields: {
        field1: {
          name: 'field1',
          options: { reference: true },
        },
        field2: {
          name: 'field2',
          options: { reference: true, model: 'ReferenceModelA' },
        },
      },
    });
  });

  it('modelize references', () => {
    const ins = ReferenceModel.modelize({
      field1: {
        fieldA1: 'foo',
      } as any,
      field2: [],
    });

    ins.field1.should.be.instanceof(ReferenceModelA);

    const ins2 = ReferenceModel.modelize({
      field1: '1234',
      field2: [],
    });

    ins2.field1.should.be.String();

    const ins3 = ReferenceModel.modelize(
      {
        field1: '1234',
        field2: [],
      },
      { allowReference: true },
    );

    ins3.field1.should.be.instanceof(ReferenceModelA);
  });
});
