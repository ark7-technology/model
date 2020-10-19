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
        {
          modifier: 'PROTECTED',
          name: 'update',
          optional: false,
          readonly: false,
          type: 'method',
        },
      ],
    },
  },
  fields: {},
  name: 'User',
};
