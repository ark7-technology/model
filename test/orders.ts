import 'should';

import { A7Model, Mixin } from '../src';

@A7Model({})
class ParentMixin {}

@A7Model({})
@Mixin(ParentMixin)
class Parent {}

@A7Model({})
class ChildMixin {}

@A7Model({})
class ChildMixin2 {}

@A7Model({})
@Mixin(ChildMixin2)
@Mixin(ChildMixin)
class Child extends Parent {}

describe('orders', () => {
  it('generates expected orders', () => {
    A7Model.getMetadata(Child).classes.should.be.eql([
      Parent,
      ParentMixin,
      Child,
      ChildMixin,
      ChildMixin2,
    ]);
  });
});
