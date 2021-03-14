import * as _ from 'underscore';
import * as debug from 'debug';

import { A7_MODEL_CONFIG, A7_MODEL_FIELD } from './tokens';
import { Ark7ModelMetadata } from './configs';
import { MetadataError } from './errors';
import { ModelClass } from './fields';
import { runtime } from '../runtime';

const d = debug('ark7:model:Manager');

export class Manager {
  // metadataMap is case insensitive.
  private metadataMap: Map<string, Ark7ModelMetadata> = new Map();

  constructor() {
    d('Manager instance created.');
  }

  reset() {
    d('Manager instance reset.');
    this.metadataMap.clear();
  }

  hasMetadata<T>(name: string | ModelClass<T>): boolean {
    const key = (_.isString(name) ? name : name.name).toLowerCase();
    return this.metadataMap.has(key);
  }

  getMetadata<T>(name: string | ModelClass<T>): Ark7ModelMetadata {
    const eKey = _.isString(name) ? name : name.$modelClassName;
    if (eKey == null) {
      console.error(
        'Cannot determine the name of object, forget add @A7Model({}) annotation?',
        name,
      );
      throw new MetadataError('');
    }

    const key = eKey.toLowerCase();
    const metadata = this.metadataMap.get(key);

    if (metadata == null) {
      d('model %O not set (%O).', name, this.metadataMap.size);
      throw new MetadataError(key);
    }

    if (metadata.configs == null) {
      metadata.configs =
        Reflect.getOwnMetadata(A7_MODEL_CONFIG, metadata.modelClass) || {};
    }

    if (metadata.fields == null) {
      metadata.fields =
        (metadata.modelClass.prototype
          ? Reflect.getMetadata(A7_MODEL_FIELD, metadata.modelClass.prototype)
          : {}) || {};
    }

    metadata.createCombinedFields(this);

    return metadata;
  }

  register<T>(name: string, modelClass: ModelClass<T>) {
    modelClass.$modelClassName = name;

    const lower = name.toLowerCase();
    if (this.metadataMap.has(lower)) {
      throw new Error(`Model ${name} has already been registered.`);
    }

    this.metadataMap.set(lower, new Ark7ModelMetadata(modelClass, name));

    d('register model %O (%O).', name, this.metadataMap.size);
  }

  private isEnabled(className: string, options: ClassUMLOptions): boolean {
    return _.find(options.omitClasses, (c) => c === className) == null;
  }

  classUML(
    className: string,
    options: ClassUMLOptions = {},
  ): mermaid.MermaidStatement[] {
    if (!this.isEnabled(className, options)) {
      return [];
    }

    const statements: mermaid.MermaidStatement[] = [];

    const metadata = this.getMetadata(className);

    _.each(Array.from(metadata.combinedFields.entries()), ([name, field]) => {
      if (['$attach', 'toJSON', 'toObject'].indexOf(name) >= 0) {
        return;
      }

      statements.push({
        type: 'field',
        className,
        fieldName: name,
        fieldType: runtime.typeName(field.prop.type),
      });
    });

    if (metadata.superClass) {
      const superClassName = metadata.superClass.$modelClassName;

      if (this.isEnabled(superClassName, options)) {
        statements.push(...this.classUML(superClassName, options));
        statements.push({
          type: 'relationship',
          baseClass: metadata.superClass.$modelClassName,
          targetClass: metadata.modelClass.$modelClassName,
          relationship: 'inherit',
        });
      }
    }

    return statements;
  }

  UML(options: UMLOptions = {}): string {
    const seedClasses =
      options.seedClasses ?? Array.from(this.metadataMap.keys());

    const omitClasses = options.omitClasses ?? ['StrictModel'];

    const statements: mermaid.MermaidStatement[] = [];

    _.each(seedClasses, (seedClass) => {
      statements.push(
        ...this.classUML(seedClass, {
          omitClasses,
        }),
      );
    });

    return mermaid.toString(statements);
  }
}

export namespace mermaid {
  export function sortKey(statement: MermaidStatement): string {
    switch (statement.type) {
      case 'field':
        return `1:${statement.className}`;

      case 'relationship':
        return `0`;
    }
  }

  export function toString(
    statement: MermaidStatement | MermaidStatement[],
    previous?: MermaidStatement,
  ): string {
    if (_.isArray(statement)) {
      const sortedStatements = _.sortBy(statement, sortKey);
      return _.chain(sortedStatements)
        .map((s, idx) => toString(s, sortedStatements[idx - 1]))
        .join('\n')
        .value();
    }

    let ret: string =
      previous == null || sortKey(previous) === sortKey(statement) ? '' : '\n';

    switch (statement.type) {
      case 'field':
        ret += `${statement.className} : ${statement.fieldType} ${statement.fieldName}`;
        break;

      case 'relationship':
        switch (statement.relationship) {
          case 'inherit':
            ret += `${statement.baseClass} <|-- ${statement.targetClass}`;
            break;
        }
        break;
    }

    return ret;
  }

  export type MermaidStatement =
    | {
        type: 'field';
        className: string;
        fieldName: string;
        fieldType: string;
      }
    | {
        type: 'relationship';
        baseClass: string;
        targetClass: string;
        relationship: 'inherit';
      };
}

export interface ClassUMLOptions {
  maskClasses?: string[];
  omitClasses?: string[];
}

export interface UMLOptions {
  seedClasses?: string[];
  maskClasses?: string[];
  omitClasses?: string[];
}

export const manager = new Manager();
