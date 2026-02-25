import { StrictModel } from '../../core';

/**
 * Options for the {@link StrictModel.$clone} method.
 */
export interface CloneOptions {
  /**
   * If true, performs a deep clone by calling `modelize(this.toJSON())`,
   * creating a fully independent instance. If false (default), performs a
   * shallow clone using `_.clone()`.
   */
  deep?: boolean;

  /**
   * If true, preserves the `_id` field in the cloned instance. By default,
   * `_id` is omitted from the clone.
   */
  withId?: boolean;
}

/**
 * Resource handler interface. Implement this to provide server-side CRUD
 * operations for $update and $delete.
 */
export interface ResourceHandler {
  /**
   * Persist the update to the server. Called by {@link StrictModel.$update}
   * when the instance is a root model.
   *
   * @param instance - The model instance being updated.
   * @param obj - The partial object containing fields to update. For nested
   *   models, keys are dot-path prefixed (e.g. `"address.city": "NYC"`).
   * @returns The updated model data from the server.
   */
  update(instance: StrictModel, obj: object): Promise<any>;

  /**
   * Delete the model from the server. Called by {@link StrictModel.$delete}
   * when the instance is a root model.
   *
   * @param instance - The model instance being deleted.
   * @returns The server response, or null/undefined for successful deletion.
   */
  remove(instance: StrictModel): Promise<any>;
}

/**
 * Global configuration for the resource plugin. All settings are centralized
 * here and can be updated via {@link configureResource}.
 */
export interface ResourceConfigs {
  /**
   * The resource handler that provides server-side behavior for
   * {@link StrictModel.$update} and {@link StrictModel.$delete}.
   *
   * Must be set before using `$update`, `$save`, or `$delete` on root model
   * instances. Nested models delegate to their parent automatically.
   */
  handler?: ResourceHandler;
}

const _resourceConfigs: ResourceConfigs = {};

/**
 * Configure the resource plugin. Merges the provided options into the
 * existing configuration.
 *
 * @example
 * ```typescript
 * import { configureResource } from '@ark7/model/resource';
 *
 * configureResource({
 *   handler: {
 *     async update(instance, obj) {
 *       return fetch(`/api/users/${instance._id}`, {
 *         method: 'POST',
 *         body: JSON.stringify(obj),
 *       }).then(r => r.json());
 *     },
 *     async remove(instance) {
 *       return fetch(`/api/users/${instance._id}`, {
 *         method: 'DELETE',
 *       });
 *     },
 *   },
 * });
 * ```
 */
export function configureResource(configs: ResourceConfigs) {
  Object.assign(_resourceConfigs, configs);
}

/**
 * Returns the current resource plugin configuration.
 */
export function getResourceConfigs(): ResourceConfigs {
  return _resourceConfigs;
}
