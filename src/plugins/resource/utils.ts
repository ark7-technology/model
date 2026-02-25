import * as _ from 'underscore';

/**
 * Transform all keys of an object using a mapping function.
 *
 * @param obj - The source object.
 * @param fn - A function that receives each key and returns the new key.
 * @returns A new object with transformed keys and the original values.
 *
 * @example
 * ```typescript
 * mapKey({ foo: 1, bar: 2 }, (k) => k.toUpperCase());
 * // { FOO: 1, BAR: 2 }
 * ```
 */
export function mapKey(
  obj: any,
  fn: (key: string) => string,
): { [key: string]: any } {
  const result: any = {};
  _.each(obj, (v: any, k: string) => {
    result[fn(k)] = v;
  });
  return result;
}

/**
 * Prefix all keys of an object with a given string. Useful for building
 * dot-path update objects for nested model updates.
 *
 * @param obj - The source object.
 * @param prefix - The prefix to prepend to each key.
 * @returns A new object with prefixed keys.
 *
 * @example
 * ```typescript
 * addPrefixToObjectKey({ city: 'NYC', zip: '10001' }, 'address.');
 * // { 'address.city': 'NYC', 'address.zip': '10001' }
 * ```
 */
export function addPrefixToObjectKey(
  obj: any,
  prefix: string,
): { [key: string]: any } {
  return mapKey(obj, (key) => prefix + key);
}
