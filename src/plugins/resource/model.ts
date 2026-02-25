import * as _ from 'underscore';
import * as debug from 'debug';

import {
  A7Model,
  Ark7ModelMetadata,
  ModelizeOptions,
  StrictModel,
} from '../../core';
import { CloneOptions, buildHandlerOptions, getResourceConfigs } from './types';
import { addPrefixToObjectKey } from './utils';

const d = debug('ark7:model:resource');

// --- modelize override ---

const oldModelize = StrictModel.modelize;

StrictModel.modelize = function modelize(
  o: any,
  options: ModelizeOptions = {},
) {
  return oldModelize.call(
    this,
    o,
    _.extend({}, options, {
      attachFieldMetadata: true,
      allowReference: true,
    }),
  );
};

// --- $metadata ---

StrictModel.prototype.$metadata = function $metadata(): Ark7ModelMetadata {
  return A7Model.getMetadata((this as any).__proto__.constructor.name);
};

// --- $set ---

StrictModel.prototype.$set = function $set(
  this: StrictModel,
  name: string,
  obj: any,
): StrictModel {
  const metadata = this.$metadata();
  const idx = name.indexOf('.');

  if (idx === -1) {
    if (metadata.combinedFields.has(name)) {
      const field = metadata.combinedFields.get(name);

      (this as any)[name] = field.modelize(obj, {
        meta: {
          $parent: this,
          $path: name,
        },
      });
    } else {
      (this as any)[name] = obj;
    }
  } else {
    const first = name.substring(0, idx);
    const last = name.substring(idx + 1);

    if (metadata.combinedFields.has(first)) {
      const field = metadata.combinedFields.get(first);
      if ((this as any)[first] == null) {
        (this as any)[first] = field.modelize(
          {},
          { meta: { $parent: this, $path: first } },
        );
      }

      (this as any)[first].$set(last, obj);
    } else {
      setNestedPath(this, name, obj);
    }
  }

  this.$attach({ $dirty: true });

  return this;
};

// --- $root ---

StrictModel.prototype.$root = function $root(): StrictModel {
  const parent = (this as any).$parent;
  return _.isArray(parent)
    ? parent
    : parent == null
    ? this
    : parent.$root();
};

// --- $processResponse ---

StrictModel.prototype.$processResponse =
  async function $processResponse<T extends StrictModel>(
    this: T,
    obj: any,
  ): Promise<any> {
    d('$processResponse() called', obj);

    const root: StrictModel = this.$root() as any;

    if (obj == null || obj.$attach == null) {
      // Deletion: remove from parent array.
      if ((this as any).$isArray) {
        const parent = (this as any).$parent;
        const path = (this as any).$path;
        const index = (this as any).$index;

        parent[path].splice(index, 1);

        _.each(parent[path], (val: any, idx: number) => {
          if (val?.$attach) {
            val.$attach({ $index: idx });
          }
        });
      }
    } else {
      const objKeys = _.filter(_.keys(obj), (k) => !k.startsWith('$'));
      const thisKeys = _.filter(_.keys(this), (k) => !k.startsWith('$'));

      d(
        'processResponse() patch %o with %o, obj keys: %o, this keys: %o',
        this,
        obj,
        objKeys,
        thisKeys,
      );

      for (const key of objKeys) {
        if ((this as any)[key] !== (obj as any)[key]) {
          const val = (obj as any)[key];

          if (_.isArray(val)) {
            if ((this as any)[key] == null) {
              (this as any)[key] = [];
            }

            for (let i = 0; i < val.length; i++) {
              const v = val[i];

              if (v instanceof StrictModel) {
                v.$attach({ $parent: this });
              }
              (this as any)[key][i] = v;
            }

            if (val.length < (this as any)[key].length) {
              (this as any)[key].splice(
                val.length,
                (this as any)[key].length - val.length,
              );
            }
          } else {
            if (val instanceof StrictModel) {
              val.$attach({ $parent: this });
            }
            (this as any)[key] = val;
          }
        }
      }

      for (const key of _.difference(thisKeys, objKeys)) {
        delete (this as any)[key];
      }
    }

    d('processResponse() returns: %O', root);
    return root;
  };

// --- $update ---

StrictModel.prototype.$update = async function $update(
  this: StrictModel,
  obj: object,
): Promise<any> {
  const parent = (this as any).$parent;

  // If not the root, call recursively with prefixed keys.
  if (parent != null && !_.isArray(parent)) {
    const prefix = (this as any).$isArray
      ? (this as any).$path + '.' + (this as any).$index + '.'
      : (this as any).$path + '.';

    return parent.$update(addPrefixToObjectKey(obj, prefix));
  }

  const { handler } = getResourceConfigs();

  if (handler == null) {
    throw new Error(
      'No ResourceHandler configured. Call configureResource({ handler }) to enable $update.',
    );
  }

  const opts = buildHandlerOptions((this as any).__proto__.constructor);
  const result = await handler.update(opts, obj, this);
  return this.$processResponse(result);
};

// --- $save ---

StrictModel.prototype.$save = async function $save(
  this: StrictModel,
): Promise<any> {
  return this.$update(this.toJSON());
};

// --- $delete ---

StrictModel.prototype.$delete = async function $delete(
  this: StrictModel,
): Promise<any> {
  d('$delete() called: %O', this);

  const parent = (this as any).$parent;

  if (parent != null && !_.isArray(parent)) {
    if ((this as any).$isArray) {
      const parentArray: object[] = parent[(this as any).$path];
      parentArray.splice((this as any).$index, 1);

      return parent.$update({
        [(this as any).$path]: parentArray,
      });
    } else {
      const ins = parent.toJSON();
      delete ins[(this as any).$path];
      return parent.$update(ins);
    }
  }

  const { handler } = getResourceConfigs();

  if (handler == null) {
    throw new Error(
      'No ResourceHandler configured. Call configureResource({ handler }) to enable $delete.',
    );
  }

  const opts = buildHandlerOptions((this as any).__proto__.constructor);
  const result = await handler.remove(opts, this);
  return this.$processResponse(result);
};

// --- $clone ---

StrictModel.prototype.$clone = function $clone(
  this: StrictModel,
  options: CloneOptions = {},
): StrictModel {
  if (!options.deep) {
    const proto = Object.getPrototypeOf(this);
    Object.setPrototypeOf(this, null);
    const o = _.omit(
      _.clone(this),
      '$abort',
      '$promise',
      '$resolved',
      !options?.withId ? '_id' : '___',
    );
    Object.setPrototypeOf(this, proto);
    Object.setPrototypeOf(o, proto);

    return o as any;
  } else {
    return (this as any).__proto__.constructor.modelize(this.toJSON());
  }
};

// --- $copy ---

StrictModel.prototype.$copy = function $copy(
  this: StrictModel,
  obj: any,
): StrictModel {
  const ret = this.$clone();
  _.extend(ret, obj);
  return ret;
};

// --- Internal utilities ---

function setNestedPath(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] == null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
