import { A7Model, StrictModel } from '../../src';

@A7Model({})
export class Name extends StrictModel {
  first: string;
  last: string;
}
