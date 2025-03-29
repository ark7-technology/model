import * as _ from 'underscore';

import { Field } from '../fields';

/**
 * Add tag to the current field.
 *
 * @param tag - The tag to add to the field.
 *
 * @example
 * // Set the tag directly:
 * @Tag('ConfigField')
 * settings: Settings;
 */
export function Tag(tag: string | string[]): PropertyDecorator {
  return Field<TagOptions>({
    tags: _.flatten([tag]),
  });
}

export interface TagOptions {
  tags: string[];
}
