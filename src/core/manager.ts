import * as _ from 'underscore';
import * as debug from 'debug';

import { A7_MODEL_FIELD } from './tokens';
import { Ark7ModelMetadata, getArk7ModelConfig } from './configs';
import { Enum } from './enums';
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
      metadata.configs = getArk7ModelConfig(metadata.modelClass);
    }

    metadata.fields =
      (metadata.modelClass.prototype
        ? Reflect.getMetadata(A7_MODEL_FIELD, metadata.modelClass.prototype)
        : {}) || {};

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
    if (className == null || !this.hasMetadata(className)) {
      return false;
    }

    if (!options.enums?.enabled && this.getMetadata(className).isEnum) {
      return false;
    }

    return (
      (_.isEmpty(options.maskClasses) ||
        options.maskClasses.indexOf(className) >= 0) &&
      _.find(options.omitClasses, (c) => c === className) == null
    );
  }

  private isEnded(className: string, options: ClassUMLOptions): boolean {
    return (
      !_.isEmpty(options.endClasses) &&
      options.endClasses.indexOf(className) >= 0
    );
  }

  classUML(
    className: string,
    options: ClassUMLOptions = {},
  ): mermaid.MermaidStatement[] {
    if (_.find(options.visitedClasses, (c) => c === className)) {
      return [];
    }

    if (!this.isEnabled(className, options)) {
      return [];
    }

    const newOpt = _.defaults(
      { visitedClasses: _.union(options.visitedClasses, [className]) },
      options,
    );
    const extend = !this.isEnded(className, options);

    const statements: mermaid.MermaidStatement[] = [];

    const metadata = this.getMetadata(className);

    if (metadata.isEnum && !options.fields?.disabled) {
      statements.push({
        type: 'classAnnotation',
        className,
        annotation: 'enumeration',
      });

      _.each((metadata.modelClass as typeof Enum).enums, (val, key) => {
        statements.push({
          type: 'field',
          className,
          fieldName: key === val ? '' : key,
          fieldType: val,
        });
      });
    }

    if (metadata.combinedFields.has('_id')) {
      statements.push({
        type: 'classAnnotation',
        className,
        annotation: 'model',
      });
    }

    const entries = Array.from(metadata.combinedFields.entries());

    _.each(
      options.fields?.sortByKey ? _.sortBy(entries, ([name]) => name) : entries,
      ([name, field]) => {
        if (['$attach', 'toJSON', 'toObject'].indexOf(name) >= 0) {
          return;
        }

        if (field.prop == null || field.name === '_id') {
          return;
        }

        if (
          !options.fields?.includeInherits &&
          field.source !== metadata.modelClass
        ) {
          return;
        }

        const t = mermaid.getExtractedType(field.prop.type);

        if (t != null && this.isEnabled(t.referenceType, newOpt) && extend) {
          statements.push({
            type: 'relationship',
            baseClass: className,
            targetClass: t.referenceType,
            relationship: t.isModelReference
              ? t.isArray
                ? 'aggregation'
                : 'association'
              : 'composition',
          });

          statements.push(...this.classUML(t.referenceType, newOpt));
        }

        if (!options.fields?.disabled) {
          statements.push({
            type: 'field',
            className,
            fieldName: `${name}${field.isVirtualReference ? '*' : ''}`,
            fieldType: runtime.typeName(field.prop.type),
          });
        }
      },
    );

    if (metadata.superClass) {
      const superClassName = metadata.superClass.$modelClassName;

      if (this.isEnabled(superClassName, newOpt)) {
        statements.push(...this.classUML(superClassName, newOpt));
        statements.push({
          type: 'relationship',
          baseClass: metadata.superClass.$modelClassName,
          targetClass: metadata.modelClass.$modelClassName,
          relationship: 'inheritance',
        });
      }
    }

    return statements;
  }

  UML(options: UMLOptions = {}): string {
    const seedClasses =
      options.seedClasses ?? Array.from(this.metadataMap.keys());

    const omitClasses = options.omitClasses ?? [
      'StrictModel',
      'Model',
      'Date',
      'ID',
    ];

    const statements: mermaid.MermaidStatement[] = [];

    _.each(seedClasses, (seedClass) => {
      statements.push(
        ...this.classUML(
          seedClass,
          _.defaults(
            {
              omitClasses,
            },
            _.omit(options, 'seedClasses'),
          ),
        ),
      );
    });

    return `classDiagram\n\n${mermaid.toString(statements)}\n`;
  }
}

export namespace mermaid {
  export function sortKey(statement: MermaidStatement): string {
    switch (statement.type) {
      case 'field':
      case 'classAnnotation':
        return `1:${statement.className}`;

      case 'relationship':
        return `0`;
    }
  }

  export function hashKey(statement: MermaidStatement): string {
    switch (statement.type) {
      case 'field':
        return `1:${statement.className}:${statement.fieldName}:${statement.fieldType}`;

      case 'classAnnotation':
        return `1:${statement.className}:${statement.annotation}`;

      case 'relationship':
        return `0:${statement.relationship}:${statement.baseClass}:${statement.targetClass}`;
    }
  }

  export function isReverseRelationship(
    a: MermaidStatement,
    b: MermaidStatement,
  ): boolean {
    return (
      a.type === 'relationship' &&
      b.type === 'relationship' &&
      a.baseClass === b.targetClass &&
      a.targetClass === b.baseClass
    );
  }

  export function toString(
    statement: MermaidStatement | MermaidStatement[],
    allStatements?: MermaidStatement[],
    idx?: number,
  ): string {
    if (_.isArray(statement)) {
      const sortedStatements = _.sortBy(_.uniq(statement, hashKey), sortKey);
      return _.chain(sortedStatements)
        .map((s, idx) => toString(s, sortedStatements, idx))
        .filter((x) => !!x)
        .join('\n')
        .value();
    }

    const previous = allStatements && allStatements[idx - 1];
    let reverse: MermaidStatement;

    for (let i = 0; i < allStatements.length; i++) {
      if (i < idx && isReverseRelationship(allStatements[i], statement)) {
        return null;
      }
      if (i > idx && isReverseRelationship(allStatements[i], statement)) {
        reverse = allStatements[i];
        break;
      }
    }

    let ret: string =
      previous == null || sortKey(previous) === sortKey(statement) ? '' : '\n';

    switch (statement.type) {
      case 'field':
        ret +=
          statement.fieldType === 'method'
            ? `${statement.className} : ${statement.fieldName}()`
            : `${statement.className} : ${statement.fieldType}${
                statement.fieldName ? ' ' + statement.fieldName : ''
              }`;
        break;

      case 'relationship':
        let relation: string;

        switch (statement.relationship) {
          case 'inheritance':
            relation = '<|--';
            break;

          case 'composition':
            relation = '*--';
            break;

          case 'aggregation':
            relation = 'o--';
            break;

          case 'association':
            relation = '<--';
            break;
        }

        if (reverse && reverse.type === 'relationship') {
          switch (reverse.relationship) {
            case 'inheritance':
              relation += '|>';
              break;

            case 'composition':
              relation += '*';
              break;

            case 'aggregation':
              relation += 'o';
              break;

            case 'association':
              relation += '>';
              break;
          }
        }

        ret += `${statement.baseClass} ${relation} ${statement.targetClass}`;
        break;

      case 'classAnnotation':
        ret += `class ${statement.className} {\n  <<${statement.annotation}>>\n}`;
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
        relationship:
          | 'inheritance'
          | 'composition'
          | 'aggregation'
          | 'association';
      }
    | {
        type: 'classAnnotation';
        className: string;
        annotation: string;
      };

  export function getExtractedType(type: runtime.Type): ExtractedType {
    if (runtime.isReferenceType(type)) {
      return {
        isArray: false,
        isModelReference: false,
        referenceType: type.referenceName,
      };
    }

    if (runtime.isArrayType(type)) {
      const t = getExtractedType(type.arrayElementType);
      return t && _.extend(t, { isArray: true });
    }

    if (runtime.isParameterizedType(type) && type.selfType === 'Ref') {
      const t = getExtractedType(type.typeArgumentType);
      return t && _.extend(t, { isModelReference: true });
    }
  }

  export interface ExtractedType {
    isArray: boolean;
    isModelReference: boolean;
    referenceType: string;
  }
}

export interface ClassUMLOptions {
  /** Only the mask classes will exist in the result. */
  maskClasses?: string[];

  /** Classes to be omitted in the result. */
  omitClasses?: string[];

  /** Classes will be in the result but without expanding. */
  endClasses?: string[];

  /** Classes have been visited before. */
  visitedClasses?: string[];

  enums?: {
    /** If enum classes will be listed in the result. */
    enabled?: boolean;
  };

  fields?: {
    /** If the fields will be listed in the result. */
    disabled?: boolean;

    /** If the fields from parent or mixin classes will be listed. */
    includeInherits?: boolean;

    sortByKey?: boolean;
  };
}

export interface UMLOptions extends ClassUMLOptions {
  /** The seed classes to start with, default with all the classes. */
  seedClasses?: string[];
}

export const manager = new Manager();
