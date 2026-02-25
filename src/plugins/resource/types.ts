import { A7Model, Config, ModelClass, StrictModel } from '../../core';

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
 * Options passed as the first argument to every {@link ResourceHandler}
 * method. Contains the model's resource configuration resolved at call time.
 *
 * This is the {@link ResourceModelOptions} with `path` guaranteed (defaults
 * to the model class name).
 */
export interface ResourceHandlerOptions {
  /** The path prefix for this model's API endpoint. */
  path: string;

  /** Whether CRUD static methods are enabled for this model. */
  crud?: boolean;

  /** Singleton configuration for this model. */
  singleton?: boolean | string;
}

/**
 * Unified resource handler interface. Provides server-side behavior for both
 * instance-level operations (`$update`, `$delete`) and class-level operations
 * (`create`, `get`, `query`, `remove`, `sGet`).
 *
 * Every method receives {@link ResourceHandlerOptions} as its first argument.
 * Instance-level methods receive the model instance as their last argument.
 *
 * @example
 * ```typescript
 * configureResource({
 *   handler: {
 *     async update(options, obj, instance) { ... },
 *     async remove(options, instance) { ... },
 *     async create(options, data) { ... },
 *     async get(options, id) { ... },
 *     async query(options, params) { ... },
 *     async findOne(options, query) { ... },
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
   * @param options - Handler options (path, crud, singleton).
   * @param obj - The partial object containing fields to update. For nested
   *   models, keys are dot-path prefixed (e.g. `"address.city": "NYC"`).
   * @param instance - The model instance being updated.
   * @returns The updated model data from the server.
   */
  update(options: ResourceHandlerOptions, obj: object, instance: StrictModel): Promise<any>;

  /**
   * Delete the model from the server. Called by {@link StrictModel.$delete}
   * when the instance is a root model, and by `Model.remove(id)` for
   * class-level deletion.
   *
   * @param options - Handler options (path, crud, singleton).
   * @param instance - The model instance being deleted.
   * @returns The server response, or null/undefined for successful deletion.
   */
  remove(options: ResourceHandlerOptions, instance: StrictModel): Promise<any>;

  // --- CRUD class-level (optional, requires crud: true) ---

  /**
   * Create a new resource on the server.
   *
   * @param options - Handler options (path, crud, singleton).
   * @param data - The data for the new resource.
   * @returns The created resource data from the server.
   */
  create?(options: ResourceHandlerOptions, data: object): Promise<any>;

  /**
   * Fetch a single resource by ID.
   *
   * @param options - Handler options (path, crud, singleton).
   * @param id - The resource identifier.
   * @returns The resource data from the server.
   */
  get?(options: ResourceHandlerOptions, id: any): Promise<any>;

  /**
   * Query/find multiple resources.
   *
   * @param options - Handler options (path, crud, singleton).
   * @param params - Optional query parameters (filters, sorting, etc.).
   * @returns An array of resource data from the server.
   */
  query?(options: ResourceHandlerOptions, params?: object): Promise<any[]>;

  // --- Singleton / findOne (optional, requires singleton config) ---

  /**
   * Find a single resource matching the given query.
   *
   * Used by `Model.sGet(val?)` for singleton models. The query is built
   * automatically from the `singleton` config:
   * - `singleton: true` → `findOne(options, {})`
   * - `singleton: 'configKey'` → `findOne(options, { configKey: val })`
   *
   * @param options - Handler options (path, crud, singleton).
   * @param query - Query object to match a single resource.
   * @returns The resource data from the server.
   */
  findOne?(options: ResourceHandlerOptions, query: object): Promise<any>;
}

/**
 * Options for {@link A7ResourceModel} to extend an existing model with
 * resource plugin configuration.
 */
export interface ResourceModelOptions {
  /**
   * Enable class-level CRUD static methods (`create`, `get`, `query`,
   * `remove`) on this model.
   */
  crud?: boolean;

  /**
   * Enable class-level singleton static methods (`sGet`, `sUpdate`) on
   * this model.
   *
   * - `true` — singleton with no key.
   * - `'keyName'` — keyed singleton.
   */
  singleton?: boolean | string;

  /**
   * The path prefix for this model's API endpoint. Passed to handler
   * methods via {@link ResourceHandlerOptions}. Defaults to the model
   * class name if not specified.
   */
  path?: string;
}

/**
 * Decorator / function that merges resource configuration into an existing
 * model's config. Use this to enable CRUD or singleton operations on models
 * defined in other packages without modifying their source.
 *
 * @param options - Resource model options (`crud`, `singleton`).
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * import { User } from '@other/package';
 * import { A7ResourceModel } from '@ark7/model/resource';
 *
 * // Programmatic call
 * A7ResourceModel({ crud: true })(User);
 *
 * // Or as a decorator on a local subclass
 * @A7ResourceModel({ singleton: 'tenant' })
 * class TenantConfig extends Model { ... }
 * ```
 */
export function A7ResourceModel(options: ResourceModelOptions): ClassDecorator {
  return Config(options);
}

/**
 * Build {@link ResourceHandlerOptions} for a model class by reading the
 * model's resource config, falling back to the model class name for `path`.
 */
export function buildHandlerOptions(
  modelClass: ModelClass<any>,
): ResourceHandlerOptions {
  const metadata = A7Model.getMetadata(modelClass);
  const configs: any = metadata.configs ?? {};
  return {
    path: configs.path ?? metadata.name,
    crud: configs.crud,
    singleton: configs.singleton,
  };
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
 *     async update(options, obj, instance) {
 *       return fetch(`/api/${options.path}/${instance._id}`, {
 *         method: 'POST',
 *         body: JSON.stringify(obj),
 *       }).then(r => r.json());
 *     },
 *     async remove(options, instance) {
 *       return fetch(`/api/${options.path}/${instance._id}`, {
 *         method: 'DELETE',
 *       });
 *     },
 *     // Class-level CRUD (optional)
 *     async create(options, data) { ... },
 *     async get(options, id) { ... },
 *     async query(options, params) { ... },
 *     // Singleton (optional)
 *     async findOne(options, query) { ... },
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
