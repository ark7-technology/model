import 'should';

import { A7Model, StrictModel } from '../src';

@A7Model({})
class AttachmentModel extends StrictModel {
  foo: string;
}

describe('attachment', () => {
  describe('.$attach', () => {
    it('should be able to attach data to a model', () => {
      const ins = AttachmentModel.modelize({ foo: 'bar' });

      ins.$attach({ hello: 'world' }).should.be.deepEqual({
        __$attach: true,
        hello: 'world',
      });

      ins.toObject().should.be.deepEqual({
        foo: 'bar',
      });

      ins.$attach().should.be.deepEqual({
        __$attach: true,
        hello: 'world',
      });
    });
  });
});
