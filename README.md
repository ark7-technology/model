# @ark7/model

In many projects, duplicating identical models can lead to numerous bugs. The
**@ark7/model** library addresses this challenge by offering a unified model
class layer that operates seamlessly across various environments, ensuring
consistent business logic and reducing redundancy.

Supported Platforms:

- [Node.js (MongoDB)](https://github.com/ark7-technology/model-mongoose)
- Browser
- ProtocolBuffer

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Defining a Model](#defining-a-model)
- [Model](#model)
  - [Model Metadata](#model-metadata)
  - [Model Definition](#model-definition)
  - [Discrimination](#discrimination)
  - [Mixin](#mixin)
- [Field](#field)
  - [Required vs. Optional](#required-vs-optional)
  - [Readonly](#readonly)
  - [Autogen](#autogen)
  - [Default Values](#default-values)
  - [Model.modelize()](#modelmodelize)
  - [.toObject() & .toJSON()](#toobject--tojson)
  - [Data Level](#data-level)
  - [Reference](#reference)
  - [Virtual](#virtual)
  - [Index](#index)
  - [Encrypted](#encrypted)
  - [Tag](#tag)
  - [NoPersist](#nopersist)
  - [Present](#present)
  - [Important](#important)
  - [MMap](#mmap)
  - [IDType](#idtype)
  - [Editable](#editable)
  - [Proto](#proto)
  - [Attachment](#attachment)
- [Built-in Types](#built-in-types)
  - [Email](#email)
  - [StringUUID](#stringuuid)
  - [SSN](#ssn)
  - [PhoneNumber](#phonenumber)
  - [Date](#date)
  - [ID](#id)

---

## Installation

Install the package using npm:

```shell
npm install @ark7/model
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

Models are defined by decorating the class with `A7Model` or using `A7Model.provide(ModelClass)`.

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

Once a model is defined, class metadata, field metadata, and model schema can be retrieved through `A7Model.getMetadata(ModelClass)`. For example:

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

Model-level configuration can be injected using either `@A7Model()` or `@Config()`:

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

A model can mix in other models.

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

### Required vs. Optional

The `required` modifier can be declared at the `field metadata` or `schema` level:

```Typescript
class Name {
  first: string;  // schema level required

  @Required()     // field metadata level required
  last: string;   // schema level required
}
```

Sometimes, the two levels may have conflicting opinions:

```Typescript
class Name {
  first?: string;  // schema level optional

  @Required(false) // field metadata level: optional
  last: string;    // schema level: required
}
```

It depends on the adapter to resolve these conflicts.

### Readonly

The `readonly` modifier can be declared at the `field metadata` or `schema` level:

```Typescript
class Name {
  readonly first: string;  // schema level readonly

  @Readonly()     // field metadata level readonly
  last: string;   // schema level non-readonly
}
```

It depends on the adapter to resolve these conflicts.

### Autogen

The `@Autogen()` decorator marks a field as both readonly and auto-generated. This is useful for fields that are automatically populated by the system (e.g., timestamps, computed values).

```Typescript
@A7Model({})
class Record extends Model {
  @Autogen()
  createdAt: Date;
}
```

### Default

The `default` value can be set at the `field metadata` level:

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

user.toObject().should.be.deepEqual({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  }
});
```

### Data Level

Each field is assigned a level number. The higher the level number, the more restricted or confidential the field is. We have predefined five data levels:

    1. BASIC (10) - The basic field that will be used in the most scenarios.
                    Usually, presented when it's referenced by other model.

    2. SHORT (20) - The fields that are useful for displaying as a list or
                    table. Usually, presented in the find or search endpoints.

    3. DETAIL (30) - The fields that contains detail information. Usually,
                     presented in the get endpoints.

    4. CONFIDENTIAL (40) - The fields that contains sensitive information.
                           Usually, not returning to the client or only to
                           admins with special privileges.

    5. NEVER (1000) - The fields that are never returns.

**Projection:**

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

user.toObject({ level: DefaultDataLevel.BASIC }).should.be.deepEqual({
  email: 'test@google.com',
});

user.toObject({ level: DefaultDataLevel.SHORT }).should.be.deepEqual({
  email: 'test@google.com',
  name: {
    first: 'foo',
    last: 'bar',
  },
});
```

**Population:**

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

### Reference

The `@Reference()` decorator marks a field as a reference to another model. The `Ref<T>` type represents a field that can hold either an ID or a populated model instance.

```Typescript
import { A7Model, Model, Ref, Reference, asModel, idOf, isSameModel } from '@ark7/model';

@A7Model({})
class Author extends Model {
  name: string;
}

@A7Model({})
class Book extends Model {
  title: string;

  @Reference()
  author: Ref<Author>;
}
```

Utility functions for working with references:

- `asModel(ref)` (alias `$$`) - Casts a `Ref<T>` to `T`.
- `idOf(ref)` - Extracts the ID from a reference.
- `isModel(ref)` - Checks if the reference is a populated model.
- `isSameModel(ref1, ref2)` - Compares two references by their IDs.

### Virtual

The `@Virtual()` decorator defines a virtual field that is populated from another model via a local/foreign field relationship, similar to Mongoose virtuals.

```Typescript
@A7Model({})
class Author extends Model {
  name: string;

  @Virtual({
    ref: 'Book',
    localField: '_id',
    foreignField: 'author',
  })
  books: Book[];
}

@A7Model({})
class Book extends Model {
  title: string;

  @Reference()
  author: Ref<Author>;
}
```

Options:

- `ref` - The referenced model name or class.
- `localField` - The field on the current model to match against.
- `foreignField` - The field on the referenced model to match.
- `justOne` - If true, populates a single document instead of an array.
- `count` - If true, returns only the count of matching documents.
- `match` - Additional query conditions for filtering.

### Index

The `@Index()`, `@Unique()`, and `@CompoundIndex()` decorators configure database indexes.

```Typescript
@A7Model({})
@CompoundIndex({ email: 1, name: 1 })
class User extends Model {
  @Unique()
  email: string;

  @Index()
  name: string;

  @Index({ sparse: true })
  nickname?: string;
}
```

- `@Index(options?)` - Creates an index on the field. Options: `unique`, `sparse`, `indexDisabled`.
- `@Unique(options?)` - Shorthand for a unique index. Options: `sparse`.
- `@CompoundIndex(fields, options?)` - Class-level decorator for compound indexes.

### Encrypted

The `@Encrypted()` decorator marks a field for encryption at the database level.

```Typescript
@A7Model({})
class User extends Model {
  @Encrypted()
  ssn: string;

  @Encrypted({ algorithm: EncryptAlgorithm.AEAD_AES_256_CBC_HMAC_SHA_512_RANDOM })
  secretNotes: string;
}
```

Options:

- `algorithm` - Encryption algorithm (default: `AEAD_AES_256_CBC_HMAC_SHA_512_DETERMINISTIC`).
- `keyAltName` - The data key alias name (default: `'defaultDataKey'`).
- `autoDecrypt` - Whether to auto-decrypt the field (default: `false`).

### Tag

The `@Tag()` decorator adds tags to a field for categorization or filtering.

```Typescript
@A7Model({})
class Settings extends Model {
  @Tag('ConfigField')
  theme: string;

  @Tag(['ConfigField', 'UserPref'])
  language: string;
}
```

### NoPersist

The `@NoPersist()` decorator marks a field as in-memory only. The field will not be persisted to the database.

```Typescript
@A7Model({})
class Session extends Model {
  userId: string;

  @NoPersist()
  cachedProfile: object;
}
```

### Present

The `@Present()` decorator controls whether a field is present based on a static value or a condition evaluated against the model instance.

```Typescript
@A7Model({})
class Feature extends Model {
  @Present()
  enabledField: string;

  @Present(() => process.env.NODE_ENV === 'development')
  debugField: string;
}
```

### Important

The `@Important()` decorator prevents a field from being overridden by the natural field resolution order (Child Class > Mixin Class > Parent Class).

```Typescript
@A7Model({})
class Base extends Model {
  @Important()
  @Detail()
  role: string;
}
```

### MMap

The `@MMap()` decorator and `MMap<T>` type provide Map support for model fields.

```Typescript
import { A7Model, Model, MMap } from '@ark7/model';

@A7Model({})
class Config extends Model {
  @MMap(String)
  settings: MMap<string>;
}
```

### IDType

The `@IDType()` decorator configures ID handling for nested fields.

```Typescript
@A7Model({})
class Record extends Model {
  @IDType({ forceIdToString: true })
  nested: SubRecord;
}
```

### Editable

The `@Editable()` decorator attaches UI-oriented metadata to a field, useful for auto-generating forms and display components.

```Typescript
@A7Model({})
class User extends Model {
  @Editable({
    inputType: 'text',
    hint: 'Enter your full name',
  })
  name: string;

  @Editable({
    inputType: 'email',
    hideDisplay: true,
  })
  email: string;

  @Editable({
    type: 'select',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
    ],
  })
  role: string;
}
```

Options include: `type`, `inputType`, `options`, `hint`, `info`, `disabled`, `hideDisplay`, `hideEditing`, `hide`, `reference`, `displayWidth`, `editWidth`, `listItemRemovable`, `copyText`, `autoHide`.

### Proto

The `@Proto()` decorator configures Protocol Buffer field options.

```Typescript
@A7Model({})
class Message extends Model {
  @Proto({ protoAssignedId: 1 })
  title: string;

  @Proto({ protoAssignedId: 2, protoFieldType: 'int32' })
  count: number;
}
```

Options:

- `protoAssignedId` - The Protocol Buffer field number.
- `protoFieldType` - Override the proto field type (`'none'`, `'int32'`, `'int64'`, `'string'`, `'float'`, `'double'`).

### Attachment

Sometimes, it's necessary to attach metadata to an instance.

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

Email address type.

### StringUUID

UUID string type. Used for UUID fields that should be stored as strings.

### SSN

Social Security Number type.

### PhoneNumber

Phone number type.

### Date

Date type with custom modelize handler that automatically converts values to `Date` instances via `new Date(val)`.

### ID

Base ID interface used for model identifiers (e.g., `_id` fields).
