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

export type EditableEvaluate<T> = T | ((this: any) => T);

export type EditableType =
  | 'input'
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
