import { A7Model } from './configs';

A7Model.provide<Date>({
  modelize: (val) => (val == null ? null : new Date(val)),
});
