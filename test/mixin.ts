import 'should';

import { A7Model, Default, Mixin, StrictModel } from '../src';

describe('mixin', () => {
  @A7Model({})
  class BaseMixinModel extends StrictModel {
    get whoami() {
      return 'BaseMixinModel';
    }
  }

  @A7Model({})
  class ExtendMixinModel extends BaseMixinModel {
    get whoami() {
      return 'ExtendMixinModel';
    }
  }

  @A7Model({})
  class Mixin1Model {
    @Default('f11') field11?: string;

    @Default('mixin1') field?: string;

    mixinField?: BaseMixinModel;
  }

  @A7Model({})
  class Mixin2Model {
    @Default('f21') field21?: string;
  }

  @A7Model({})
  @Mixin(Mixin1Model)
  @Mixin(Mixin2Model)
  class MixinModel extends StrictModel {
    @Default('current') field?: string;

    mixinField?: ExtendMixinModel;
  }

  interface MixinModel extends Mixin1Model, Mixin2Model {}

  it('specifies the mixin classes', () => {
    const metadata = A7Model.getMetadata(MixinModel);

    metadata.should.have.properties({
      name: 'MixinModel',
      modelClass: MixinModel.prototype.constructor,
      superClass: StrictModel.prototype.constructor,
      configs: {
        schema: {
          name: 'MixinModel',
          props: [
            {
              name: 'field',
              optional: true,
              modifier: 'PUBLIC',
              type: 'string',
            },
            {
              name: 'mixinField',
              optional: true,
              modifier: 'PUBLIC',
              type: { referenceName: 'ExtendMixinModel' },
            },
          ],
        },
        mixinClasses: [Mixin2Model, Mixin1Model],
      },
      fields: {
        field: { name: 'field', options: { default: 'current' } },
      },
    });
  });

  it('modelize current get function', () => {
    const i = ExtendMixinModel.modelize({});
    i.should.be.instanceOf(ExtendMixinModel);

    i.whoami.should.be.eql('ExtendMixinModel');
  });

  it('modelize mixin models', () => {
    const ins = MixinModel.modelize({
      mixinField: {},
    });

    ins.toJSON().should.be.deepEqual({
      field11: 'f11',
      field21: 'f21',
      field: 'current',
      mixinField: {},
    });

    ins.mixinField.should.be.instanceOf(ExtendMixinModel);
    ins.mixinField.whoami.should.be.eql('ExtendMixinModel');
  });
});
