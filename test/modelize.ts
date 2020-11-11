import 'should';

import { A7Model, StrictModel } from '../src';

@A7Model({})
class ModelizeModel2 extends StrictModel {
  foo: string;
}

@A7Model({})
class ModelizeModel1 extends StrictModel {
  model: ModelizeModel2;
  models: ModelizeModel2[];
}

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

    ins.toJSON().should.be.deepEqual({
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
