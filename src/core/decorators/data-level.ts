import _ from 'underscore';

import { Field } from '../fields';

/**
 * Specify the data level of the current field
 */
export function Level(level: number | LevelOptions): PropertyDecorator {
  return Field<LevelOptions>(_.isNumber(level) ? { level } : level);
}

export interface LevelOptions {
  level?: number;
  passLevelMap?: {
    [current: number]: number;
  };
}

export enum DefaultDataLevel {
  // Basic information which is usually used when referenced from other models.
  BASIC = 10,

  // Short information which is usually returned by search queries.
  SHORT = 20,

  // Detail information which is usually returned by get request.
  DETAIL = 30,

  // Confidential information which is not supposed to be returned.
  CONFIDENTIAL = 40,
}

export function Basic(): PropertyDecorator {
  return Level(DefaultDataLevel.BASIC);
}

export function Short(): PropertyDecorator {
  return Level(DefaultDataLevel.SHORT);
}

export function Detail(): PropertyDecorator {
  return Level(DefaultDataLevel.DETAIL);
}

export function Confidential(): PropertyDecorator {
  return Level(DefaultDataLevel.CONFIDENTIAL);
}
