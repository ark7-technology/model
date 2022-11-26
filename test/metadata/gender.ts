import { Enum } from '../../src';

export const genderMetadata: any = {
  superClass: Enum.prototype.constructor,
  configs: {
    schema: {
      name: 'Gender',
      props: [],
      fileName: process.cwd() + '/test/models/users.ts',
    },
  },
  fields: {},
  name: 'Gender',
};
