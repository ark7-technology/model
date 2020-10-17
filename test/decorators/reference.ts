import 'should';

import { A7Model, Ref, Reference } from '../../src';

describe('decorators', () => {
  describe('reference', () => {
    @A7Model({})
    class ReferenceModelA {
      fieldA1: string;
    }

    @A7Model({})
    class ReferenceModel {
      @Reference()
      field1: Ref<ReferenceModelA>;

      @Reference({ model: 'ReferenceModelA' })
      field2: Ref<ReferenceModelA>[];
    }

    it('specifies the required', () => {
      A7Model.getMetadata(ReferenceModel).should.be.deepEqual({
        name: 'ReferenceModel',
        modelClass: ReferenceModel.prototype.constructor,
        superClass: null,
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
                readonly: false,
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
                readonly: false,
              },
            ],
          },
        },
        fields: {
          field1: {
            propertyName: 'field1',
            options: { reference: true },
          },
          field2: {
            propertyName: 'field2',
            options: { reference: true, model: 'ReferenceModelA' },
          },
        },
      });
    });
  });
});
