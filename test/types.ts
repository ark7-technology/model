import {
  AsObject,
  FunctionPropertyNames,
  IfEquals,
  NonFunctionPropertyNames,
  NonReadonlyPropertyNames,
  ReadonlyPropertyNames,
  Writable,
} from '../src';

/**
 * Test for FunctionPropertyNames.
 */
export const _testFunctionPropertyNames1: IfEquals<
  FunctionPropertyNames<{
    func1: () => {};
    func2: () => {};
    number1: number;
    string1: string;
  }>,
  'func1' | 'func2',
  'true'
> = 'true';

export const _testNonFunctionPropertyNames1: IfEquals<
  NonFunctionPropertyNames<{
    func1: () => {};
    func2: () => {};
    number1: number;
    string1: string;
  }>,
  'number1' | 'string1',
  'true'
> = 'true';

/**
 * Test for class.
 */
abstract class A {
  a1: string;
  readonly a2?: number;
  a3: {};

  a4: () => void;
  abstract a5(hello: string): void;

  get a6(): string {
    return null;
  }
}

abstract class B {
  b1: string;
  b2: A;
  b3: () => A;
  b4: any;
}

export const _testA_FunctionNames: IfEquals<
  FunctionPropertyNames<A>,
  'a4' | 'a5',
  'true'
> = 'true';

export const _testA_NonFunctionNames: IfEquals<
  NonFunctionPropertyNames<A>,
  'a1' | 'a2' | 'a3' | 'a6',
  'true'
> = 'true';

export const _testA_ReadonlyPropertyNames: IfEquals<
  ReadonlyPropertyNames<A>,
  'a2' | 'a6',
  'true'
> = 'true';

export const _testA_NonReadonlyPropertyNames: IfEquals<
  NonReadonlyPropertyNames<A>,
  'a1' | 'a3' | 'a4' | 'a5',
  'true'
> = 'true';

export const _testA_WritableReadonlyProperties: IfEquals<
  NonReadonlyPropertyNames<Writable<A>>,
  'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6',
  'true'
> = 'true';

export const _testA_AsObject: IfEquals<
  AsObject<A>,
  {
    a1: string;
    a2?: number;
    a3: {};
    a6?: string;
  },
  'true'
> = 'true';

export const _testB_FunctionNames: IfEquals<
  FunctionPropertyNames<B>,
  'b3',
  'true'
> = 'true';

export const _testB_AsObject: IfEquals<
  AsObject<B>,
  {
    b1: string;
    b2: {
      a1: string;
      a2?: number;
      a3: {};
      a6?: string;
    };
    b4: any;
  },
  'true'
> = 'true';
