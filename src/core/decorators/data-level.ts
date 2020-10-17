import { Field } from '../fields';

/**
 * Specify the data level of the current field
 */
export function Level(level: number): PropertyDecorator {
  return Field<LevelOptions>({ level });
}

export interface LevelOptions {
  level: number;
}
