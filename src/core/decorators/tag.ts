import * as _ from 'underscore';

import { Field } from '../fields';

/**
 * Add tag to the current field.
 */
export function Tag(tag: string | string[]): PropertyDecorator {
  return Field<TagOptions>({
    tags: _.flatten([tag]),
  });
}

export interface TagOptions {
  tags: string[];
}
