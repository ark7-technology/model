import { Config, Field, metaModeller } from '../../src';

export class Name {
  @Field() first: string;
  @Field() last: string;
}

@Config({
  hello: 'world1',
  hello3: 'world3',
})
export class User {
  @Field() name?: Name;
}

const meta = metaModeller.generateArk7Model$$(User);

console.log(JSON.stringify(meta, null, 2));

console.log(JSON.stringify(metaModeller.generateArk7Model$$(Name), null, 2));
