import { A7Model, Config, Field } from '../../src';

export class Model {
  @Field() _id: string;
}

export enum Gender {
  MAN = 0,
  WOMAN = 1,
}

A7Model.provide(Gender);

@Config({})
export class Name extends Model {
  readonly first: string;
  @Field() last: string;
}

A7Model.provide(Name);

@A7Model({
  hello: 'world1',
  hello3: 'world3',
})
export class User {
  name?: Name;
  gender: Gender;
  phone: number | string;

  createdAt: Date;

  private _birthday: number;

  get birthday(): number {
    return this._birthday;
  }

  protected update(user: User) {}
}
