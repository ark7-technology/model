import 'should';

import { A7Model } from '../../src';
import { Model, Name, User } from '../models/users';

describe('A7Model', () => {
  describe('.getMetadata', () => {
    it('should return expected value for Name', () => {
      A7Model.getMetadata('Name').should.be.deepEqual({
        modelClass: Name.prototype.constructor,
        superClass: Model.prototype.constructor,
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
          _id: { propertyName: '_id', options: {} },
          last: { propertyName: 'last', options: {} },
        },
        name: 'Name',
      });
    });

    it('should return expected value for User', () => {
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
              {
                modifier: 'PUBLIC',
                name: 'phone',
                optional: false,
                readonly: false,
                type: {
                  union: ['number', 'string'],
                },
              },
              {
                modifier: 'PUBLIC',
                name: 'createdAt',
                optional: false,
                readonly: false,
                type: {
                  referenceName: 'Date',
                },
              },
              {
                modifier: 'PRIVATE',
                name: '_birthday',
                optional: false,
                readonly: false,
                type: 'number',
              },
              {
                modifier: 'PUBLIC',
                name: 'birthday',
                optional: false,
                readonly: false,
                type: 'number',
              },
            ],
          },
        },
        fields: {},
        name: 'User',
        superClass: null,
      });
    });

    it('should return expected value for Gender', () => {
      A7Model.getMetadata('Gender').should.be.deepEqual({
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
        superClass: null,
      });
    });
  });
});
