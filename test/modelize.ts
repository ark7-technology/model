import 'should';

import {
  A7Model,
  Default,
  Detail,
  Mixin,
  ModelizeError,
  Never,
  StrictModel,
} from '../src';

@A7Model({})
class ModelizeModel3 extends StrictModel {
  @Detail()
  get foo2() {
    return 'bar';
  }

  @Never()
  get foo3() {
    return 'bar3';
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

@A7Model({})
class ModelizeModel4 extends StrictModel {
  @Default(ModelizeModel3.modelize({}))
  f3?: ModelizeModel3;
}

describe('modelize', () => {
  it('works with default model', () => {
    const ins = ModelizeModel4.modelize({}, { attachFieldMetadata: true });

    ins.f3.foo2.should.be.equal('bar');

    (ins.f3.$attach() as any).$parent.should.be.equal(ins);
  });

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

  it('throws format wrong error', () => {
    (() => {
      ModelizeModel1.modelize({
        model: '12345',
      } as any);
    }).should.throw(ModelizeError, {
      path: 'model:ModelizeModel2.foo',
      cls: ModelizeModel1,
    });
  });

  it('allows id reference', () => {
    ModelizeModel1.modelize(
      {
        model: '12345',
      } as any,
      { allowReference: true },
    )
      .toJSON()
      .should.be.deepEqual({
        foo2: 'bar',
        model: {
          foo: '',
        },
        models: [],
      });
  });
});
