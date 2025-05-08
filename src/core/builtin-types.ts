import { A7Model } from './configs';
import { ID } from './model';

A7Model.provide<Date>({
  modelize: (val) => (val == null ? null : new Date(val)),
});

export interface Email extends String {}

A7Model.provide<Email>({
  modelize: (val) => val,
});

export interface StringUUID extends String {}

A7Model.provide<StringUUID>({
  modelize: (val) => val,
});

export interface SSN extends String {}

A7Model.provide<SSN>({
  modelize: (val) => val,
});

export interface PhoneNumber extends String {}

A7Model.provide<PhoneNumber>({
  modelize: (val) => val,
});

A7Model.provide<ID>({
  modelize: (val) => val,
});
