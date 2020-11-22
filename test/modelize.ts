import 'should';

import { A7Model, Mixin, StrictModel } from '../src';

@A7Model({})
class ModelizeModel3 extends StrictModel {
  get foo2() {
    return 'bar';
  }
}

@A7Model({})
class ModelizeModel2 extends StrictModel {
  foo: string;
}

@A7Model({})
@Mixin(ModelizeModel3)
class ModelizeModel1 extends StrictModel {
  model: ModelizeModel2;
  models: ModelizeModel2[];
}

interface ModelizeModel1 extends ModelizeModel3 {}

describe('modelize', () => {
  it('works with normal data', () => {
    const ins = ModelizeModel1.modelize({
      model: {
        foo: 'foo1',
      },
      models: [
        {
          foo: 'foo2',
        },
      ],
    });

    ins.foo2.should.be.equal('bar');

    ins.toJSON().should.be.deepEqual({
      foo2: 'bar',
      model: {
        foo: 'foo1',
      },
      models: [
        {
          foo: 'foo2',
        },
      ],
    });
  });

  it('attaches metadata', () => {
    const ins = ModelizeModel1.modelize(
      {
        model: {
          foo: 'foo1',
        },
        models: [
          {
            foo: 'foo2',
          },
        ],
      },
      { attachFieldMetadata: true },
    );

    ins.toJSON().should.be.deepEqual({
      foo2: 'bar',
      model: {
        foo: 'foo1',
      },
      models: [
        {
          foo: 'foo2',
        },
      ],
    });

    ins.model.$attach().should.be.deepEqual({
      $parent: ins,
      $isArray: false,
      $path: 'model',
      __$attach: true,
    });
  });
});
