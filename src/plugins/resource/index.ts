import { Ark7ModelMetadata, Model, StrictModel } from '../../core';
import { CloneOptions } from './types';

// --- Module augmentation ---

declare module '../../core/fields' {
  export interface ModelizeMetadata {
    /** Whether the instance has been locally modified since last server sync. */
    $dirty?: boolean;
  }

  export interface StrictConfigOptions {
    /**
     * Enable class-level CRUD static methods (`create`, `get`, `query`,
     * `remove`) on this model. Requires a {@link ResourceHandler} with the
     * corresponding methods implemented.
     */
    crud?: boolean;

    /**
     * Enable class-level singleton static methods (`sGet`, `sUpdate`) on
     * this model. Requires a {@link ResourceHandler} with `findOne`
     * implemented.
     *
     * - `true` — singleton with no key. `sGet()` calls
     *   `handler.findOne(modelClass, {})`.
     * - `'keyName'` — keyed singleton. `sGet(val)` calls
     *   `handler.findOne(modelClass, { keyName: val })`.
     */
    singleton?: boolean | string;
  }

}

declare module '../../core/model' {
  export interface StrictModel {
    /**
     * Set a field value locally and modelize the result, without saving to
     * the server. Supports dot-notation for nested paths.
     *
     * For known fields (present in model metadata), the value is run through
     * `field.modelize()` to ensure proper type coercion and parent metadata
     * attachment. For unknown fields or deeply nested paths without metadata,
     * the value is set directly.
     *
     * Marks the instance as `$dirty` after mutation.
     *
     * @param name - The field name or dot-separated path (e.g.
     *   `"address.city"`).
     * @param obj - The value to set.
     * @returns The current instance for chaining.
     *
     * @example
     * ```typescript
     * const user = User.modelize({ name: { first: 'Alice', last: 'Smith' } });
     * user.$set('name.first', 'Bob');
     * user.$set('email', 'bob@example.com');
     * ```
     */
    $set(name: string, obj: any): this;

    /**
     * Update the server and patch the local instance with the response.
     *
     * For nested models (those with a `$parent`), the update is delegated
     * recursively to the parent with dot-path prefixed keys. For root models,
     * the registered {@link ResourceHandler} is called.
     *
     * @param obj - Partial object containing the fields to update. For nested
     *   models, keys are automatically prefixed with the path from root.
     * @returns The root model instance after patching.
     *
     * @example
     * ```typescript
     * // Update specific fields
     * await user.$update({ email: 'new@example.com' });
     *
     * // Nested model delegates to parent
     * await user.address.$update({ city: 'NYC' });
     * // Equivalent to: user.$update({ 'address.city': 'NYC' })
     * ```
     */
    $update<T extends Model>(obj: object): Promise<T>;

    /**
     * Save the entire model to the server. Shorthand for
     * `$update(this.toJSON())`.
     *
     * @returns The root model instance after patching.
     */
    $save<T extends Model>(): Promise<T>;

    /**
     * Delete the model from the server.
     *
     * Behavior depends on the model's position in the hierarchy:
     * - **Root model**: Calls {@link ResourceHandler.remove}.
     * - **Nested array item**: Splices the item from the parent array and
     *   calls `parent.$update()`.
     * - **Nested object field**: Removes the field from the parent and calls
     *   `parent.$update()`.
     *
     * @returns The root model instance after patching.
     */
    $delete<T extends Model>(): Promise<T>;

    /**
     * Returns the {@link Ark7ModelMetadata} for this instance's model class.
     *
     * @example
     * ```typescript
     * const user = User.modelize({ email: 'test@example.com' });
     * const metadata = user.$metadata();
     * metadata.name; // 'User'
     * metadata.combinedFields; // Map of all fields
     * ```
     */
    $metadata(): Ark7ModelMetadata;

    /**
     * Process a server response and patch the current instance in-place.
     *
     * If the response is null (deletion), removes the item from its parent
     * array and re-indexes siblings. Otherwise, patches all non-`$` prefixed
     * keys from the response onto the instance, adds new keys, and removes
     * keys that are no longer present.
     *
     * @param obj - The server response object, or null for deletion.
     * @returns The root model instance after patching.
     */
    $processResponse(obj: any): Promise<any>;

    /**
     * Navigate up the parent hierarchy and return the root model instance.
     *
     * - If the parent is a plain array, returns the array.
     * - If there is no parent, returns `this`.
     * - Otherwise, recursively calls `$parent.$root()`.
     */
    $root(): StrictModel;

    /**
     * Create a clone of the current instance.
     *
     * @param options - Clone options.
     * @param options.deep - If true, creates a fully independent deep clone
     *   via `modelize(this.toJSON())`. Defaults to false (shallow clone).
     * @param options.withId - If true, preserves the `_id` field. Defaults to
     *   false.
     * @returns A new instance with the same prototype.
     *
     * @example
     * ```typescript
     * const copy = user.$clone();              // shallow, no _id
     * const full = user.$clone({ deep: true }); // deep, no _id
     * const dup = user.$clone({ withId: true }); // shallow, with _id
     * ```
     */
    $clone(options?: CloneOptions): this;

    /**
     * Create a clone of the current instance and extend it with additional
     * properties. Shorthand for `this.$clone()` followed by
     * `_.extend(clone, obj)`.
     *
     * @param obj - Properties to merge into the clone.
     * @returns A new instance with the merged properties.
     *
     * @example
     * ```typescript
     * const draft = user.$copy({ email: 'draft@example.com' });
     * ```
     */
    $copy(obj: any): this;
  }
}

// --- Side-effect imports (installs prototype and static methods) ---

import './model';
import './crud';
import './singleton';

// --- Re-exports ---

export { CloneOptions, ResourceHandler, ResourceConfigs, configureResource, getResourceConfigs } from './types';
export { addPrefixToObjectKey, mapKey } from './utils';
