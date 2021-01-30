import * as _ from 'underscore';

import { Field } from '../fields';

/**
 * Config data level for the field.
 *
 * Each field will be assigned a level number.  The higher the level number, the
 * more restrict or confidential the field is.  We have pre-defined five data
 * levels:
 *
 *   1. BASIC (10) - The basic field that will be used in the most scenarios.
 *                   Usually, presented when it's referenced by other model.
 *
 *   2. SHORT (20) - The fields that are useful for displaying as a list or
 *                   table. Usually, presented in the find or search endpoints.
 *
 *   3. DETAIL (30) - The fields that contains detail information. Usually,
 *                    presented in the get endpoints.
 *
 *   4. CONFIDENTIAL (40) - The fields that contains sensitive information.
 *                          Usually, not returning to the client or only to
 *                          admins with special privileges.
 *
 *   5. NEVER (1000) - The fields that are never returns.
 *
 *
 * **Projection**
 *
 * We can do the projection by providing a filter level. Any fields with level
 * numbers that are smaller or equal to the filter level will be projected. You
 * can tune the filter level by specifying the passLevelMap in the option.
 *
 * **Population**
 *
 * For a reference field, when the filter level is greater than the
 * populateLevel specified by the option, the field will be populated.
 */
export function Level(level: number | LevelOptions): PropertyDecorator {
  return Field<LevelOptions>(_.isNumber(level) ? { level } : level);
}

export interface PassLevelMap {
  [current: number]: number;
}

/**
 * Options for the data level.
 */
export interface LevelOptions {
  /** The current level for the field. */
  level?: number;

  /** A map to change the current filter level. */
  passLevelMap?: PassLevelMap;

  /** Minimum level to populate the reference field, default is NEVER. */
  populateLevel?: number;
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

export function Never(passLevelMap?: PassLevelMap): PropertyDecorator {
  return Level(
    passLevelMap == null
      ? DefaultDataLevel.NEVER
      : { level: DefaultDataLevel.NEVER, passLevelMap },
  );
}
