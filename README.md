# @ark7/model

@ark7/model is a model layer which is shareable across multiple environments:

- Nodejs (MongoDB)
- Browser

## Installation

Install the dependencies package:

```shell
$ npm install @ark7/model
```

Add transform plugin to tsconfig.json:

```
// tsconfig.json

{
  ...
  "plugins": [{
    "transform": "@ark7/model/transformer"
  }],
}
```

## Quick Start

### Define a Model

Models are defined by decorating the class with `A7Model`, or using
`A7Model.provide(ModelClass)`.

```Typescript
// models/users.ts

import { A7Model } from '@ark7/model';

@A7Model({})
export class Name {

  readonly first: string;

  last: string;
}

@A7Model({})
export class User {

  email: string;

  name?: Name;
}

// Another way to register User model:
//
// A7Model.provide(User)
```

## Model

### Model Metadata

Once the model is defined, class metadata, field metadata, and model schema are
retrievable through `A7Model.getMetadata(ModelClass)`. For example:

```Typescript
@A7Model({})
class Name {
  first: string;
  last: string;
}

A7Model.getMetadata(Name).should.be.deepEqual({
  modelClass: Name.prototype.constructor,
  superClass: null,
  configs: {
    schema: {
      name: 'Name',
      props: [
        {
          modifier: 'PUBLIC',
          name: 'first',
          optional: false,
          readonly: false,
          type: 'string',
        },
        {
          modifier: 'PUBLIC',
          name: 'last',
          optional: false,
          readonly: false,
          type: 'string',
        },
      ],
    },
  },
  fields: {},
  name: 'Name',
});
```

### Model Definition

Model level configuration can be injected by either `@A7Model()` or `@Config()`:

```Typescript
@A7Model<ModelConfig>({ foo: 'bar' })
class MCModel { }

interface ModelConfig {
  foo: string;
}

(A7Model.getMetadata(MCModel).configs as ModelConfig).foo.should.be.equal(
  'bar'
);
```

## Field

### Required v.s. Optional

The `required` modifier can be declared on `field metadata` or `schema` level:

```Typescript
class Name {
  first: string;  // schema level required

  @Required()     // field metadata level required
  last: string;   // schema level required
}
```

Sometimes, the two levels may have conflict opinions:

```Typescript
class Name {
  first?: string;  // schema level optional

  @Required(false) // field metadata level: optional
  last: string;    // schema level: required
}
```

It depends on the adaptor to deal with those conflicts.

### Readonly

The `readonly` modifier can be declared on `field metadata` or `schema` level:

```Typescript
class Name {
  readonly first: string;  // schema level readonly

  @Readonly()     // field metadata level readonly
  last: string;   // schema level non-readonly
}
```

It depends on the adaptor to deal with the conflicts.
