import * as _ from 'underscore';

import { Field } from '../fields';

/**
 * Decorates a class property with editable options.
 *
 * Use this decorator to configure dynamic, editable behaviors for your model fields.
 * More examples can be found [here](https://github.com/ark7-technology/model/blob/main/docs/Editable.md).
 *
 * @param options - The configuration options for the editable field.
 */
export function Editable(options: EditableOptions): PropertyDecorator {
  return Field<EditableFieldOptions>({ editable: options });
}

/**
 * Options for Editable annotation.
 */
export interface EditableOptions {
  /**
   * Specify the type of the field.
   */
  type?: EditableEvaluate<EditableType>;

  /**
   * Specifies the type of input element to render for the editable field.
   *
   * Allowed values:
   * - `'area'`: Renders a textarea for multi-line text input.
   * - `'text'`: Renders a standard single-line text input.
   * - `'date'`: Renders a date picker.
   * - `'datetime'`: Renders a date and time picker.
   * - `'currency'`: Renders an input formatted for currency values.
   * - `'percent'`: Renders an input formatted for percentage values.
   * - `'number'`: Renders a numeric input.
   * - `'boolean'`: Renders a checkbox or toggle for boolean values.
   * - `'email'`: Renders an input for email addresses.
   * - `'password'`: Renders a password input.
   * - `'link'`: Renders an input for URLs.
   * - `'duration'`: Renders an input for time durations.
   * - `'phone'`: Renders an input formatted for phone numbers.
   *
   * The property accepts either a direct value or a function that returns one.
   *
   * @example
   * // Use a text input for a name field.
   * @Editable({
   *   inputType: 'text'
   * })
   * name: string;
   *
   * @example
   * // Use a textarea for a multi-line description.
   * @Editable({
   *   inputType: 'area'
   * })
   * description: string;
   */
  inputType?: EditableEvaluate<EditableInputType>;

  /**
   * Options for select fields.
   *
   * This property is used to provide a list of options for select fields.
   * It can be an object or an array of objects, each containing a label and a value.
   */
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

  displayWidth?: EditableEvaluate<string | number>;
  editWidth?: EditableEvaluate<string | number>;
  width?: EditableEvaluate<string | number>;

  /**
   * Specify the text to copy.
   */
  copyText?: EditableEvaluate<string>;

  /**
   * Automatically hide the field in display mode if the value is false or non-existent.
   */
  autoHide?: EditableEvaluate<boolean>;

  /**
   * Determines if the field should be hidden in display mode.
   *
   * @example
   * // Hide the field in display mode based on a condition.
   * @Editable({
   *   hideDisplay(this: ThisClass) {
   *     return this.conditionalFieldValue;
   *   }
   * })
   * fieldName: string;
   */
  hideDisplay?: EditableEvaluate<boolean>;

  /**
   * Determines if the field should be hidden in editing mode.
   *
   * @example
   * // Hide the field in editing mode based on a condition.
   * @Editable({
   *   hideEditing(this: ThisClass) {
   *     return this.conditionalFieldValue;
   *   }
   * })
   * fieldName: string;
   */
  hideEditing?: EditableEvaluate<boolean>;

  /**
   * Determines if the field should be hidden in both display and editing modes.
   *
   * @example
   * // Hide the field in both display and editing modes based on a condition.
   * @Editable({
   *   hide(this: ThisClass) {
   *     return this.conditionalFieldValue;
   *   }
   * })
   * fieldName: string;
   */
  hide?: EditableEvaluate<boolean>;

  /**
   * Reference options.
   *
   * @example
   * // Example of using reference with query and navigate options.
   * reference: {
   *   query: {},
   *   navigate: {
   *     routerLink: '/flow/characters/${_id}',
   *     queryParams: {},
   *     fragment: 'Settings',
   *   },
   * }
   */
  reference?: EditableEvaluate<EditableOptionsReference>;
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

  /**
   * Link the value to an external link.
   */
  externalLink?: string;
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
  | 'phone'
  | 'typescript'
  | 'javascript';
