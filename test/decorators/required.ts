import 'should';

import { A7Model, Required } from '../../src';

describe('decorators', () => {
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
                readonly: false,
              },
              {
                name: 'field2',
                optional: false,
                modifier: 'PUBLIC',
                type: 'string',
                readonly: false,
              },
              {
                name: 'field3',
                optional: false,
                modifier: 'PUBLIC',
                type: 'string',
                readonly: false,
              },
            ],
          },
        },
        fields: {
          field1: { propertyName: 'field1', options: { required: true } },
          field2: { propertyName: 'field2', options: { required: false } },
          field3: { propertyName: 'field3', options: { required } },
        },
      });
    });
  });
});
