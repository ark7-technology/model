import 'should';

import { A7Model, Level } from '../../src';

describe('decorators', () => {
  describe('data-level', () => {
    @A7Model({})
    class DataLevelModel {
      @Level(1) level1: string;
      @Level(2) level2: string;
      @Level(3) level3: string;
    }

    it('specifies the data levels', () => {
      A7Model.getMetadata(DataLevelModel).should.be.deepEqual({
        name: 'DataLevelModel',
        modelClass: DataLevelModel.prototype.constructor,
        superClass: null,
        configs: {
          schema: {
            name: 'DataLevelModel',
            props: [
              {
                name: 'level1',
                optional: false,
                modifier: 'PUBLIC',
                type: 'string',
                readonly: false,
              },
              {
                name: 'level2',
                optional: false,
                modifier: 'PUBLIC',
                type: 'string',
                readonly: false,
              },
              {
                name: 'level3',
                optional: false,
                modifier: 'PUBLIC',
                type: 'string',
                readonly: false,
              },
            ],
          },
        },
        fields: {
          level3: { propertyName: 'level3', options: { level: 3 } },
          level2: { propertyName: 'level2', options: { level: 2 } },
          level1: { propertyName: 'level1', options: { level: 1 } },
        },
      });
    });
  });
});
