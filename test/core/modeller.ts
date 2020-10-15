import 'should';

import { Name, User } from '../models/users';
import { metaModeller } from '../../src';

// metaModeller.register$$(Gender);
metaModeller.register$$(User);
metaModeller.register$$(Name);

describe('metaModeller', () => {
  describe('.getMetadata', () => {
    it('should return expected value', () => {
      metaModeller.getMetadata('Name').should.be.deepEqual({
        configs: {},
        fields: {
          first: {
            type: 'string',
            propertyName: 'first',
            options: {
              optional: false,
              readonly: true,
            },
          },
          last: {
            type: 'string',
            propertyName: 'last',
            options: {
              optional: false,
              readonly: false,
            },
          },
        },
        name: 'Name',
      });

      metaModeller.getMetadata('User').should.be.deepEqual({
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
        fields: {
          name: {
            type: {
              referenceName: 'Name',
            },
            propertyName: 'name',
            options: {
              optional: true,
              readonly: false,
            },
          },
          gender: {
            type: {
              referenceName: 'Gender',
            },
            propertyName: 'gender',
            options: {
              optional: false,
              readonly: false,
            },
          },
        },
        name: 'User',
      });
    });
  });
});
