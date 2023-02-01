import * as _ from 'underscore';

import { Field } from '../fields';

/**
 * Annotate the property with Editable options.
 */
export function Editable(options: EditableOptions): PropertyDecorator {
  return Field<EditableFieldOptions>({ editable: options });
}

/**
 * Options for Editable annotation.
 */
export interface EditableOptions {
  type?: EditableEvaluate<EditableType>;
  inputType?: EditableEvaluate<EditableInputType>;

  options?: EditableEvaluate<object | Array<{ label: any; value: any }>>;

  hint?: EditableEvaluate<string>;
  info?: EditableEvaluate<string>;

  /**
   * Control if the field is disabled.
   */
  disabled?: EditableEvaluate<boolean>;

  /**
   * For list item, check if the list item is removable.
   *
   * @example
   * The following code disables the removable function if the author has any
   * publications:
   *
   * ```
   * @EditableOptions({
   *   listItemRemovable: (author: Author) => author.publications === 0;
   * })
   * authors: Ref<Author>[];
   * ```
   */
  listItemRemovable?: EditableEvaluate<boolean, [any]>;

  displayWidth?: string | number;
  editWidth?: string | number;
  width?: string | number;

  autoHide?: boolean;
  hideDisplay?: boolean;
  hideEditing?: boolean;
  hide?: boolean;

  /**
   * Reference options.
   */
  reference?: EditableOptionsReference;
}

export interface EditableOptionsReference {
  query?: object | (() => object);
  navigate?: EditableOptionsNavigation;
}

export interface EditableFieldOptions {
  editable: EditableOptions;
}

export interface EditableOptionsNavigation {
  routerLink?: string;
  queryParams?: object;
  fragment?: string;
}

export type EditableEvaluate<T, Args extends Array<any> = []> =
  | T
  | ((this: any, ...a: Args) => T);

export type EditableType =
  | 'input'
  | 'textarea'
  | 'list-input'
  | 'select'
  | 'money'
  | 'dynamic'
  | 'unknown'
  | 'select-toggle'
  | 'model-reference';

export type EditableInputType =
  | 'area'
  | 'text'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percent'
  | 'number'
  | 'boolean'
  | 'email'
  | 'password'
  | 'link'
  | 'duration'
  | 'phone';
