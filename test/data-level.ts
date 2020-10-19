import 'should';

import { A7Model, Level, StrictModel } from '../src';

describe('data-level', () => {
  @A7Model({})
  class DataLevelModel extends StrictModel {
    @Level(1) level1: string;
    @Level(2) level2: string;
    @Level(3) level3: string;
  }

  describe('.metadata', () => {
    it('specifies the data levels', () => {
      A7Model.getMetadata(DataLevelModel).should.have.properties({
        name: 'DataLevelModel',
        modelClass: DataLevelModel.prototype.constructor,
        superClass: StrictModel.prototype.constructor,
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
          level3: { name: 'level3', options: { level: 3 } },
          level2: { name: 'level2', options: { level: 2 } },
          level1: { name: 'level1', options: { level: 1 } },
        },
      });
    });
  });

  describe('toJSON()', () => {
    it('returns on different level', () => {
      const ins = DataLevelModel.modelize({
        level1: '1',
        level2: '2',
        level3: '3',
      });

      ins.should.be.instanceof(DataLevelModel);
    });
  });
});
