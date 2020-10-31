import { A7Model } from './configs';

A7Model.provide<Date>({
  modelize: (val) => (val == null ? null : new Date(val)),
});

export interface Email extends String {}

A7Model.provide<Email>({
  modelize: (val) => val,
});

export interface UUID extends String {}

A7Model.provide<UUID>({
  modelize: (val) => val,
});
