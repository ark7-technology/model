import _ from 'underscore';

import { Field } from '../fields';

/**
 * Specify the data level of the current field
 */
export function Level(level: number | LevelOptions): PropertyDecorator {
  return Field<LevelOptions>(_.isNumber(level) ? { level } : level);
}

export interface PassLevelMap {
  [current: number]: number;
}

export interface LevelOptions {
  level?: number;
  passLevelMap?: PassLevelMap;
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

  // Never returns the field.
  NEVER = 1000,
}

export function Basic(passLevelMap?: PassLevelMap): PropertyDecorator {
  return Level(
    passLevelMap == null
      ? DefaultDataLevel.BASIC
      : { level: DefaultDataLevel.BASIC, passLevelMap },
  );
}

export function Short(passLevelMap?: PassLevelMap): PropertyDecorator {
  return Level(
    passLevelMap == null
      ? DefaultDataLevel.SHORT
      : { level: DefaultDataLevel.SHORT, passLevelMap },
  );
}

export function Detail(passLevelMap?: PassLevelMap): PropertyDecorator {
  return Level(
    passLevelMap == null
      ? DefaultDataLevel.DETAIL
      : { level: DefaultDataLevel.DETAIL, passLevelMap },
  );
}

export function Confidential(passLevelMap?: PassLevelMap): PropertyDecorator {
  return Level(
    passLevelMap == null
      ? DefaultDataLevel.CONFIDENTIAL
      : { level: DefaultDataLevel.CONFIDENTIAL, passLevelMap },
  );
}
