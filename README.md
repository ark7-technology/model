# @ark7/model

A critical problem which always leads to many bugs is the duplication of the
same models. @ark7/model is a model class layer which is shareable across
multiple environments, so that the logics are kept in sync.

- [Nodejs (MongoDB)](https://github.com/ark7-technology/model-mongoose)
- Browser

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Define a Model](#define-a-model)
- [Model](#model)
  - [Model Metadata](#model-metadata)
  - [Model Definition](#model-definition)
  - [Discrimination](#discrimination)
  - [Mixin](#mixin)
- [Field](#field)
  - [Required v.s. Optional](#required-v.s.-optional)
  - [Readonly](#readonly)
  - [Default](#default)
  - [Model.modelize()](#modelmodelize)
  - [.toObject() & .toJSON()](#toobject--tojson)
  - [Data Level](#data-level)
  - [Attachment](#attachment)
- [Built-in Types](#built-in-types)
  - [Email](#email)
  - [UUID](#uuid)

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

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

@A7Model({})
export class User {

  email: string;

  name?: Name;

  gender?: Gender;
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

### Discrimination

```Typescript
@A7Model({
  discriminatorKey: 'kind',
})
class Event extends StrictModel {
  kind?: string;
}

@A7Model({})
class MouseEvent extends Event {
  foo: string;
}

const ins = EventModel.modelize({
  kind: 'MouseEvent',
  foo: 'bar',
} as any);

ins.should.be.instanceof(MouseEvent);

const ins2 = MouseEvent.modelize({
  foo: 'bar',
});

ins2.should.be.instanceof(MouseEvent);

ins2.toObject().should.be.deepEqual({
  kind: 'MouseEvent',
  foo: 'bar',
});
```

### Mixin

A model can mixin other models.

```Typescript
@A7Model({})
class M1 {
  foo: string;
}

@A7Model({})
class M2 {
  bar: string;
}

@A7Model({})
@Mixin(M1)
@Mixin(M2)
class CombinedModel extends Model {}

interface CombinedModel extends M1, M2 {}
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

### Default

The `default` value can be set on `field metadata`:

```Typescript
class Name {
  @Default('foo')
  first: string;

  @Default(() => 'bar')
  last: string;
}
```

### Model.modelize()

```Typescript
import { A7Model, StrictModel } from '@ark7/model';

@A7Model({})
class Name extends StrictModel {
  first: string;
  last: string;
}

@A7Model({})
export class User extends StrictModel {
  email: string;
  name?: Name;
}

const user = User.modelize({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  }
});

user.should.be.instanceof(User);
user.name.should.be.instanceof(Name);
```

### .toObject() & .toJSON()

```Typescript
import { A7Model, StrictModel } from '@ark7/model';

@A7Model({})
class Name extends StrictModel {
  first: string;
  last: string;
}

@A7Model({})
export class User extends StrictModel {
  email: string;
  name?: Name;
}

const user = User.modelize({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  }
});

user.toObject().should.be.instanceof({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  }
});
```

### Data Level

Each field will be assigned a level number. The higher the level number, the
more restrict or confidential the field is. We have pre-defined five data
levels:

    1. BASIC (10) - The basic field that will be used in the most scenarios.
                    Usually, presented when it's referenced by other model.

    2. SHORT (20) - The fields that are useful for displaying as a list or
                    table. Usually, presented in the find or search endpoints.

    3. DETAIL (30) - The fields that contains detail information. Usually,
                     presented in the get endpoints.

    4. CONFIDENTIAL (40) - The fields that contains sensitive information.
                           Usually, not returning to the client or only to
                           admins with special privileges.

    5. NEVER (50) - The fields that are never returns.

**Projection**

We can do the projection by providing a filter level. Any fields with level
numbers that are smaller or equal to the filter level will be projected. You can
tune the filter level by specifying the passLevelMap in the option.

```Typescript
@A7Model({})
class Name extends StrictModel {
  @Basic() first: string;
  @Basic() last: string;
}

@A7Model({})
export class User extends StrictModel {
  @Basic() email: string;
  @Short() name?: Name;
}

const user = User.modelize({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  }
});

user.toObject({ level: DefaultDataLevel.BASIC }).should.be.instanceof({
  email: 'test@google.com',
});

user.toObject({ level: DefaultDataLevel.SHORT }).should.be.instanceof({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  },
});
```

**Population**

For a reference field, when the filter level is greater than the
populateLevel specified by the option, the field will be populated.

```typescript
@A7Model({})
export class User extends Model {
  @Virtual({ ... })
  @Level({ populateLevel: DefaultDataLevel.DETAIL })
  posts: Post[];
}

@A7Model({})
export class Post extends Model {
  author: Ref<User>;
}
```

### Attachment

Sometimes, we need to attach metadata to an instance.

```Typescript
import { A7Model, StrictModel } from '@ark7/model';

@A7Model({})
class Name extends StrictModel {
  first: string;
  last: string;
}

const name = Name.modelize({ first: 'foo', last: 'bar'});

name.$attach({ hello: 'world' });

name.$attach().should.be.deepEqual({
  __$attach: true,
  hello: 'world',
});

// This won't affect toObject() or toJSON():
name.toObject().should.be.deepEqual({
  first: 'foo',
  last: 'bar',
});
```

## Built-in Types

### Email

Email address.

### UUID

UUID.
