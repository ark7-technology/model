// Returns the function names of an interface.
export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

// Returns the non-function names of an interface.
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

// Returns the function properties of an interface.
export type PickFunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

// Omit the function properties from an interface.
export type OmitFunctionProperties<T> = Omit<T, FunctionPropertyNames<T>>;

// A helper function to check if X == Y then A else B.
export type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X
  ? 1
  : 2) extends <T>() => T extends Y ? 1 : 2
  ? A
  : B;

// Returns the readonly property names of an interface.
export type ReadonlyPropertyNames<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];

// Returns the non-readonly property names of an interface.
export type NonReadonlyPropertyNames<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >;
}[keyof T];

export type PickReadonlyProperties<T> = Pick<T, ReadonlyPropertyNames<T>>;

export type OmitReadonlyProperties<T> = Omit<T, ReadonlyPropertyNames<T>>;

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type PartialReadonlyProperties<T> = OmitReadonlyProperties<T> &
  Writable<Partial<PickReadonlyProperties<T>>>;

export type Diff<T, U> = T extends U ? never : T; // Remove types from T that are assignable to U
export type Filter<T, U> = T extends U ? T : never; // Remove types from T that are not assignable to U

export interface POJO<V> {
  [key: string]: V;
}

type _AsObjectPure<T> = T extends Map<infer K, infer V>
  ? V extends object
    ? POJO<AsObject<V>> | Map<K, AsObject<V>> | T
    : POJO<V> | Map<K, V>
  : T extends object
  ? AsObject<T>
  : T;

export type _AsObjectDeep<T> = {
  [P in keyof T]: _AsObjectPure<T[P]>;
};

export type AsObject<T> = _AsObjectDeep<
  PartialReadonlyProperties<OmitFunctionProperties<T>>
>;

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >;
}[keyof T];
