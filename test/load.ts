import 'should';

import * as model from '../src';

describe('load', () => {
  it('should loading', () => {
    model.hello.should.be.equal('world');
  });
});
