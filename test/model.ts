import 'should';

import { Config, Field, metaModeller } from '../src';

@Config({
  hello: 'world1',
  hello3: 'world3',
})
class Model1 {
  @Field() foo?: string;
}

@Config({
  hello: 'world2',
  hello2: 'world',
})
class Model2 extends Model1 {
  @Field() bar: string;
}

const meta = metaModeller.generateArk7Model$$(Model1);

// console.log(meta);

// describe('load', () => {
// it('should loading', () => {
// getArk7ModelField(Model1).should.be.deepEqual({
// foo: {
// options: {},
// propertyName: 'foo',
// },
// });

// getArk7ModelField(Model2).should.be.deepEqual({
// foo: {
// options: {},
// propertyName: 'foo',
// },
// bar: {
// options: {},
// propertyName: 'bar',
// },
// });

// getArk7ModelConfig<Model1>(Model1).should.be.deepEqual({
// hello: 'world1',
// hello3: 'world3',
// });

// getArk7ModelConfig(Model2).should.be.deepEqual({
// hello: 'world2',
// hello2: 'world',
// hello3: 'world3',
// });
// });
// });

// let a: { foo: 'bar' };

// class P {
// hello: 'world';
// }

// function register<T extends { new (): any }>(x: T): InstanceType<T> {
// return null;
// }

// const p = register(P);

// p.hello;

// let a: number;

// function register(_x: string) {}

// register(a);
