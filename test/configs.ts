import 'should';

import { A7Model, Field } from '../src';
import { Name, User } from './models';
import { genderMetadata, nameMetadata, userMetadata } from './metadata';

@A7Model<ModelConfig>({ foo: 'bar' })
class MCModel {}

interface ModelConfig {
  foo: string;
}

@A7Model({})
class ModelConfigBaseModel {
  @Field() base1: string;

  get base2(): string {
    return this.base1;
  }
}

@A7Model({})
class ModelConfigExtModel extends ModelConfigBaseModel {
  @Field({ type: (x: string) => x }) base1: 'base1';
}

describe('configs', () => {
  describe('.getMetadata', () => {
    it('should return expected value for Name', () => {
      A7Model.getMetadata(Name).should.have.properties(nameMetadata);
    });

    it('should return expected value for Gender', () => {
      A7Model.getMetadata('Gender').should.have.properties(genderMetadata);
    });

    it('should return expected value for User', () => {
      A7Model.getMetadata(User).should.have.properties(userMetadata);
    });

    it('should be able to customize the model config', () => {
      (A7Model.getMetadata(MCModel).configs as ModelConfig).foo.should.be.equal(
        'bar',
      );
    });
  });

  describe('.combinedFields', () => {
    it('should return expected value for ModelConfigBaseModel', () => {
      const metadata = A7Model.getMetadata(ModelConfigBaseModel);
      metadata.combinedFields.should.have.keys('base1', 'base2');
      metadata.combinedFields.get('base1').should.have.properties({
        name: 'base1',
        prop: {
          name: 'base1',
          optional: false,
          modifier: 'PUBLIC',
          type: 'string',
          readonly: false,
        },
        descriptor: null,
        field: {
          name: 'base1',
          options: {},
        },
      });

      metadata.combinedFields.get('base2').should.have.properties({
        name: 'base2',
        prop: {
          name: 'base2',
          optional: false,
          modifier: 'PUBLIC',
          type: 'string',
          readonly: false,
        },
        descriptor: Object.getOwnPropertyDescriptor(
          ModelConfigBaseModel.prototype,
          'base2',
        ),
        field: null,
      });
    });
  });
});
