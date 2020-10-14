import { Config } from '../../src';

export class Name {
  readonly first: string;
  last: string;
}

@Config({
  hello: 'world1',
  hello3: 'world3',
})
export class User {
  name?: Name;
}
