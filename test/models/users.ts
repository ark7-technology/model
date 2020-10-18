import { A7Model, Model } from '../../src';
import { Name } from './name';

export enum Gender {
  MAN = 0,
  WOMAN = 1,
}

A7Model.provide(Gender);

@A7Model({
  hello: 'world1',
  hello3: 'world3',
})
export class User extends Model {
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
