import { ModelClass, StrictModel } from '../../core';

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
 * Unified resource handler interface. Provides server-side behavior for both
 * instance-level operations (`$update`, `$delete`) and class-level operations
 * (`create`, `get`, `query`, `remove`, `sGet`).
 *
 * Instance-level methods (`update`, `remove`) are required. Class-level
 * methods are optional and only needed when the corresponding feature is
 * enabled via `@A7Model({ crud: true })` or `@A7Model({ singleton: true })`.
 *
 * @example
 * ```typescript
 * configureResource({
 *   handler: {
 *     async update(instance, obj) { ... },
 *     async remove(instance) { ... },
 *     async create(modelClass, data) { ... },
 *     async get(modelClass, id) { ... },
 *     async query(modelClass, params) { ... },
 *     async findOne(modelClass, query) { ... },
 *   },
 * });
 * ```
 */
export interface ResourceHandler {
  // --- Instance-level (required) ---

  /**
   * Persist an update to the server. Called by {@link StrictModel.$update}
   * when the instance is a root model, and by `sUpdate` for singleton
   * updates.
   *
   * @param instance - The model instance being updated.
   * @param obj - The partial object containing fields to update. For nested
   *   models, keys are dot-path prefixed (e.g. `"address.city": "NYC"`).
   * @returns The updated model data from the server.
   */
  update(instance: StrictModel, obj: object): Promise<any>;

  /**
   * Delete the model from the server. Called by {@link StrictModel.$delete}
   * when the instance is a root model, and by `Model.remove(id)` for
   * class-level deletion.
   *
   * @param instance - The model instance being deleted.
   * @returns The server response, or null/undefined for successful deletion.
   */
  remove(instance: StrictModel): Promise<any>;

  // --- CRUD class-level (optional, requires crud: true) ---

  /**
   * Create a new resource on the server.
   *
   * @param modelClass - The model class being created.
   * @param data - The data for the new resource.
   * @returns The created resource data from the server.
   */
  create?(modelClass: ModelClass<any>, data: object): Promise<any>;

  /**
   * Fetch a single resource by ID.
   *
   * @param modelClass - The model class to fetch.
   * @param id - The resource identifier.
   * @returns The resource data from the server.
   */
  get?(modelClass: ModelClass<any>, id: any): Promise<any>;

  /**
   * Query/find multiple resources.
   *
   * @param modelClass - The model class to query.
   * @param params - Optional query parameters (filters, sorting, etc.).
   * @returns An array of resource data from the server.
   */
  query?(modelClass: ModelClass<any>, params?: object): Promise<any[]>;

  // --- Singleton / findOne (optional, requires singleton config) ---

  /**
   * Find a single resource matching the given query.
   *
   * Used by `Model.sGet(val?)` for singleton models. The query is built
   * automatically from the `singleton` config:
   * - `singleton: true` → `findOne(modelClass, {})`
   * - `singleton: 'configKey'` → `findOne(modelClass, { configKey: val })`
   *
   * @param modelClass - The model class.
   * @param query - Query object to match a single resource.
   * @returns The resource data from the server.
   */
  findOne?(modelClass: ModelClass<any>, query: object): Promise<any>;
}

/**
 * Global configuration for the resource plugin. All settings are centralized
 * here and can be updated via {@link configureResource}.
 */
export interface ResourceConfigs {
  /**
   * The unified resource handler that provides server-side behavior for
   * all resource operations — instance-level (`$update`, `$delete`) and
   * class-level (`create`, `get`, `query`, `remove`, `sGet`, `sUpdate`).
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
 *     // Instance-level (required)
 *     async update(instance, obj) {
 *       return fetch(`/api/${instance.$metadata().name}/${instance._id}`, {
 *         method: 'POST',
 *         body: JSON.stringify(obj),
 *       }).then(r => r.json());
 *     },
 *     async remove(instance) {
 *       return fetch(`/api/${instance.$metadata().name}/${instance._id}`, {
 *         method: 'DELETE',
 *       });
 *     },
 *     // Class-level CRUD (optional)
 *     async create(modelClass, data) { ... },
 *     async get(modelClass, id) { ... },
 *     async query(modelClass, params) { ... },
 *     // Singleton (optional)
 *     async findOne(modelClass, query) { ... },
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
