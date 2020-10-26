import 'should';

import { A7Model } from '../src';

describe('abstracts', () => {
  @A7Model({})
  abstract class AbstractModel {
    abstract get foo(): string;
    abstract set foo(val: string);
    abstract bar(): number;
  }

  it('specifies the readonly', () => {
    A7Model.getMetadata('AbstractModel').should.have.properties({
      name: 'AbstractModel',
      modelClass: AbstractModel.prototype.constructor,
      superClass: null,
      configs: {
        schema: {
          name: 'AbstractModel',
          props: [
            {
              name: 'foo',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
              readonly: false,
              abstract: true,
              getter: true,
              setter: true,
            },
            {
              name: 'bar',
              optional: false,
              modifier: 'PUBLIC',
              type: 'method',
              readonly: false,
              abstract: true,
            },
          ],
        },
      },
      fields: {},
    });
  });
});
