import 'should';

import { A7Model, Default, Mixin, StrictModel } from '../src';

describe('mixin', () => {
  // User testing models.
  @A7Model({})
  class MixinBaseUserProfile {}

  @A7Model({})
  class MixinUserProfile extends MixinBaseUserProfile {}

  @A7Model({})
  class MixinIdentity extends StrictModel {
    profile: MixinBaseUserProfile;
  }

  @A7Model({})
  @Mixin(MixinIdentity)
  class MixinBaseUser {
    profile: MixinUserProfile;
  }

  // Normal testing models.
  @A7Model({})
  class MixinUser extends MixinBaseUser {}

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

  it('modelizes right user profile', () => {
    A7Model.getMetadata(MixinUser)
      .combinedFields.get('profile')
      .prop.type.should.be.deepEqual({
        referenceName: 'MixinUserProfile',
      });
  });

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
          fileName: process.cwd() + '/test/mixin.ts',
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

  // Parent modelize testing models.

  @A7Model({})
  class MixinParent1Mixin extends StrictModel {
    get whoami() {
      return 'MixinParent1Mixin';
    }
  }

  @A7Model({})
  class MixinParent1 extends StrictModel {}

  interface MixinParent1 extends MixinParent1Mixin {}

  @A7Model({})
  class MixinParent2 extends MixinParent1 {}

  @A7Model({})
  class MixinChild3 extends MixinParent2 {}

  A7Model.getMetadata(MixinParent1);
  A7Model.getMetadata(MixinParent2);
  A7Model.getMetadata(MixinChild3);

  Mixin(MixinParent1Mixin)(MixinParent1);

  it('should modelize with the deep parent model', () => {
    const i = MixinChild3.modelize({});
    i.whoami.should.be.equal('MixinParent1Mixin');

    A7Model.getMetadata(MixinChild3)
      .combinedFields.has('whoami')
      .should.be.false();

    A7Model.getMetadata(MixinChild3, { forceFields: true })
      .combinedFields.has('whoami')
      .should.be.true();
  });
});
