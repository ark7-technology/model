import 'should';

import { A7Model, Important, Mixin } from '../src';

@A7Model({})
class ParentMixin {}

@A7Model({})
@Mixin(ParentMixin)
class Parent {}

@A7Model({})
class ChildMixin {
  @Important()
  f1() {
    return 'f1.mixin';
  }

  f2() {
    return 'f2.mixin';
  }
}

@A7Model({})
class ChildMixin2 {}

@A7Model({})
@Mixin(ChildMixin2)
@Mixin(ChildMixin)
class Child extends Parent {
  f1() {
    return 'f1.class';
  }

  f2() {
    return 'f2.mixin';
  }
}

describe('orders', () => {
  it('generates expected orders', () => {
    A7Model.getMetadata(Child).classes.should.be.eql([
      ParentMixin,
      Parent,
      ChildMixin,
      ChildMixin2,
      Child,
    ]);

    const f1 = A7Model.getMetadata(Child).combinedFields.get('f1');
    const f2 = A7Model.getMetadata(Child).combinedFields.get('f2');

    f2.source.name.should.be.equal('Child');
    f1.source.name.should.be.equal('ChildMixin');
  });
});
