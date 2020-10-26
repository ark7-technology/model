import 'should';

import _ from 'underscore';

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
  @Field({ type: String, required: true }) base1: string;

  get base2(): string {
    return this.base1;
  }

  @Field({ foo: 'bar' })
  foo() {
    return 'bar';
  }
}

@A7Model({})
class ModelConfigExtModel extends ModelConfigBaseModel {
  @Field({ type: _.identity }) base1: 'base1';
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
      metadata.combinedFields.should.have.size(3);
      metadata.combinedFields.should.have.keys('base1', 'base2', 'foo');
      metadata.combinedFields.get('base1').should.have.properties({
        name: 'base1',
        prop: {
          name: 'base1',
          optional: false,
          modifier: 'PUBLIC',
          type: 'string',
        },
        descriptor: null,
        field: {
          type: String,
          required: true,
        },
      });

      metadata.combinedFields.get('base2').should.have.properties({
        name: 'base2',
        prop: {
          name: 'base2',
          optional: false,
          modifier: 'PUBLIC',
          type: 'string',
          getter: true,
        },
        descriptor: Object.getOwnPropertyDescriptor(
          ModelConfigBaseModel.prototype,
          'base2',
        ),
        field: null,
      });

      metadata.combinedFields.get('foo').should.have.properties({
        name: 'foo',
        prop: {
          name: 'foo',
          optional: false,
          modifier: 'PUBLIC',
          type: 'method',
        },
        descriptor: Object.getOwnPropertyDescriptor(
          ModelConfigBaseModel.prototype,
          'foo',
        ),
        field: {
          foo: 'bar',
        },
      });
    });

    it('should return expected value for ModelConfigExtModel', () => {
      const metadata = A7Model.getMetadata(ModelConfigExtModel);
      metadata.combinedFields.should.have.size(3);
      metadata.combinedFields.should.have.keys('base1', 'base2', 'foo');
      metadata.combinedFields.get('base1').should.have.properties({
        name: 'base1',
        prop: {
          name: 'base1',
          optional: false,
          modifier: 'PUBLIC',
          type: null,
        },
        descriptor: null,
        field: {
          type: _.identity,
          required: true,
        },
      });

      metadata.combinedFields.get('base2').should.have.properties({
        name: 'base2',
        prop: {
          name: 'base2',
          optional: false,
          modifier: 'PUBLIC',
          type: 'string',
          getter: true,
        },
        descriptor: Object.getOwnPropertyDescriptor(
          ModelConfigBaseModel.prototype,
          'base2',
        ),
        field: null,
      });

      metadata.combinedFields.get('foo').should.have.properties({
        name: 'foo',
        prop: {
          name: 'foo',
          optional: false,
          modifier: 'PUBLIC',
          type: 'method',
        },
        descriptor: Object.getOwnPropertyDescriptor(
          ModelConfigBaseModel.prototype,
          'foo',
        ),
        field: {
          foo: 'bar',
        },
      });

      metadata.combinedFields.get('foo').isMethod.should.be.true();
    });
  });
});
