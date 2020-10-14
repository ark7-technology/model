import 'should';

import { Name, User } from '../models/users';
import { metaModeller } from '../../src';

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
        },
        name: 'User',
      });
    });
  });
});
