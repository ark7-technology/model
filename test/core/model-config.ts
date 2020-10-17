import 'should';

import { A7Model } from '../../src';

@A7Model<ModelConfig>({ foo: 'bar' })
class MCModel {}

interface ModelConfig {
  foo: string;
}

describe('A7Model', () => {
  describe('.config', () => {
    it('should return expected value for Name', () => {
      (A7Model.getMetadata(MCModel).configs as ModelConfig).foo.should.be.equal(
        'bar',
      );
    });
  });
});
