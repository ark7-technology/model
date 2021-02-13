import 'should';

import { A7Model, ID, Model } from '../src';

describe('ID', () => {
  @A7Model({})
  class TestIDModel extends Model {
    name: ID;
  }

  it('should allows name to be a string', () => {
    TestIDModel.modelize({
      name: 'hello',
    }).name.should.be.equal('hello');

    A7Model.getMetadata('ID').should.not.be.null();
  });
});
