import 'should';

import { A7Model, Default, Mixin, StrictModel } from '../src';

describe('mixin', () => {
  @A7Model({})
  class Mixin1Model {
    @Default('f11') field11?: string;
  }

  @A7Model({})
  class Mixin2Model {
    @Default('f21') field21?: string;
  }

  @A7Model({})
  @Mixin(Mixin1Model)
  @Mixin(Mixin2Model)
  class MixinModel extends StrictModel {}

  interface MixinModel extends Mixin1Model, Mixin2Model {}

  it('specifies the mixin classes', () => {
    A7Model.getMetadata(MixinModel).should.have.properties({
      name: 'MixinModel',
      modelClass: MixinModel.prototype.constructor,
      superClass: StrictModel.prototype.constructor,
      configs: {
        schema: {
          name: 'MixinModel',
          props: [],
        },
        mixinClasses: [Mixin2Model, Mixin1Model],
      },
      fields: {},
    });
  });

  it('modelize mixin models', () => {
    const ins = MixinModel.modelize({});

    ins.toJSON().should.be.deepEqual({ field11: 'f11', field21: 'f21' });
  });
});
