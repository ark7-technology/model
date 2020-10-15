import 'should';

import { A7Model } from '../../src';
import { Name, User } from '../models/users';

describe('A7Model', () => {
  describe('.getMetadata', () => {
    it('should return expected value', () => {
      A7Model.getMetadata('Name').should.have.properties({
        modelClass: Name.prototype.constructor,
        configs: {
          schema: {
            name: 'Name',
            props: [
              {
                modifier: 'PUBLIC',
                name: 'first',
                optional: false,
                readonly: true,
                type: 'string',
              },
              {
                modifier: 'PUBLIC',
                name: 'last',
                optional: false,
                readonly: false,
                type: 'string',
              },
            ],
          },
        },
        fields: {
          last: { propertyName: 'last', options: {} },
        },
        name: 'Name',
      });

      A7Model.getMetadata(User).should.be.deepEqual({
        modelClass: User.prototype.constructor,
        configs: {
          hello: 'world1',
          hello3: 'world3',
          schema: {
            name: 'User',
            props: [
              {
                modifier: 'PUBLIC',
                name: 'name',
                optional: true,
                readonly: false,
                type: {
                  referenceName: 'Name',
                },
              },
              {
                modifier: 'PUBLIC',
                name: 'gender',
                optional: false,
                readonly: false,
                type: {
                  referenceName: 'Gender',
                },
              },
            ],
          },
        },
        fields: {},
        name: 'User',
      });

      A7Model.getMetadata('Gender').should.have.properties({
        modelClass: {
          MAN: 0,
          '0': 'MAN',
          WOMAN: 1,
          '1': 'WOMAN',
        },
        configs: {
          schema: {
            name: 'Gender',
            props: [],
          },
        },
        fields: {},
        name: 'Gender',
      });
    });
  });
});
