import { Name } from '../models';
import { StrictModel } from '../../src';

export const nameMetadata = {
  modelClass: Name.prototype.constructor,
  superClass: StrictModel.prototype.constructor,
  configs: {
    schema: {
      name: 'Name',
      props: [
        {
          modifier: 'PUBLIC',
          name: 'first',
          optional: false,
          type: 'string',
        },
        {
          modifier: 'PUBLIC',
          name: 'last',
          optional: false,
          type: 'string',
        },
      ],
      fileName: 'test/models/name.ts',
    },
  },
  fields: {},
  name: 'Name',
};
