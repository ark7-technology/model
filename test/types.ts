import {
  AsObject,
  FunctionPropertyNames,
  IfEquals,
  NonFunctionPropertyNames,
  NonReadonlyPropertyNames,
  ReadonlyPropertyNames,
} from '../src';

abstract class A {
  f1: string;
  readonly f2?: number;
  f3: {};

  f4: () => void;
  abstract f5(hello: string): void;

  get f6(): string {
    return null;
  }
}

export const _a: NonFunctionPropertyNames<A>[] = ['f1', 'f2', 'f3', 'f6'];
export const _b: FunctionPropertyNames<A>[] = ['f4', 'f5'];

export const _c: ReadonlyPropertyNames<A>[] = ['f2', 'f6'];
export const _d: NonReadonlyPropertyNames<A>[] = ['f1', 'f3', 'f4', 'f5'];

export const _e: AsObject<A> = {
  f1: '1',
  f3: {},
};

export const _f: IfEquals<
  AsObject<A>,
  {
    f1: string;
    f2?: number;
    f3: {};
    f6?: string;
  },
  'foo'
> = 'foo';
