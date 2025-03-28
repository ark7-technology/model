# Editable Function Documentation

This document explains the usage and configuration options for the `Editable`
function, which is used to annotate class properties with editable options in a
TypeScript model.

## Overview

The `Editable` function is a property decorator that allows you to attach
editable options to a model property. Internally, it leverages the `Field`
function (imported from `../fields`) to set the `editable` configuration.

### Function Signature

```typescript
export function Editable(options: EditableOptions): PropertyDecorator;
```

- **Parameters**:
  - options: An object of type EditableOptions that specifies the editable configuration for the field.

## Example Usage

### Config Field Type

Below is an example demonstrating how to use the Editable decorator in a model:

```typescript
import { Editable } from './path-to-editable';
import { Ref } from './path-to-ref';
import { Author } from './author.model';

class Book {
  @Editable({
    type: 'input',
    hint: 'Enter the title of the book',
    disabled: false,
  })
  title: string;

  @Editable({
    listItemRemovable: (author: Author) => author.publications === 0,
  })
  authors: Ref<Author>[];
}
```

### Control the UI Element

Below is the updated example using numeric values, where 50 represents 50% width and 100 represents 100% width:

```typescript
import { Editable } from './editable';

class UserProfile {
  /**
   * The `bio` field demonstrates three width configurations:
   *
   * - `width`: The base width applied generally if no specific mode is provided.
   * - `displayWidth`: The width used when the field is in display (read-only) mode.
   * - `editWidth`: The width used when the field is in editing mode.
   *
   * In this example, the numeric value 50 indicates 50% width by default and in display mode,
   * while 100 indicates 100% width in edit mode.
   */
  @Editable({
    width: 50, // Base width: 50%
    displayWidth: 50, // Display mode width: 50%
    editWidth: 100, // Edit mode width: 100%
  })
  bio: string;
}
```
