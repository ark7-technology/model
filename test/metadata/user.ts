import { Model } from '../../src';
import { User } from '../models';

export const userMetadata = {
  modelClass: User.prototype.constructor,
  superClass: Model.prototype.constructor,
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
          type: {
            referenceName: 'Name',
          },
        },
        {
          modifier: 'PUBLIC',
          name: 'gender',
          optional: false,
          type: {
            referenceName: 'Gender',
          },
        },
        {
          modifier: 'PUBLIC',
          name: 'phone',
          optional: false,
          type: {
            union: ['number', 'string'],
          },
        },
        {
          modifier: 'PUBLIC',
          name: 'createdAt',
          optional: false,
          type: {
            referenceName: 'Date',
          },
        },
        {
          modifier: 'PRIVATE',
          name: '_birthday',
          optional: false,
          type: 'number',
        },
        {
          modifier: 'PUBLIC',
          name: 'birthday',
          optional: false,
          type: 'number',
          getter: true,
        },
        {
          modifier: 'PROTECTED',
          name: 'update',
          optional: false,
          type: 'method',
        },
      ],
      fileName: 'test/models/users.ts',
    },
  },
  fields: {
    _id: {
      name: '_id',
      options: { protoAssignedId: 1, level: 10 },
    },
  },
  name: 'User',
};
