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
