import 'should';

import { A7Model } from '../src';
import { Name, User } from './models';
import { genderMetadata, nameMetadata, userMetadata } from './metadata';

@A7Model<ModelConfig>({ foo: 'bar' })
class MCModel {}

interface ModelConfig {
  foo: string;
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
});
