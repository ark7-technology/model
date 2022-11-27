import * as _ from 'underscore';
import * as changeCase from 'change-case';

import { A7Model, Ark7ModelMetadata, ModelClass } from '../core';
import { runtime } from '../runtime';

export interface ProtobufMessageField {
  name: string;
  type: string;
}

export interface ProtobufMessage {
  name: string;
  fileName: string;
  location: string;

  fields: ProtobufMessageField[];
  nestedItems: ProtobufItem[];
}

export interface ProtobufEnum {
  name: string;
  fileName: string;
  location: string;

  values: string[];
}

export interface ProtobufFile {
  path: string;
  package: string;
  javaPackage?: string;
  imports: string[];

  items: ProtobufItem[];
}

type ProtobufItem = ProtobufMessage | ProtobufEnum;

export function isProtobufMessage(item: ProtobufItem): item is ProtobufMessage {
  return (item as ProtobufMessage)?.fields != null;
}

export function isProtobufEnum(item: ProtobufItem): item is ProtobufEnum {
  return (item as ProtobufMessage)?.fields == null;
}

export class ModelProtobuf {
  files: ProtobufFile[] = [];

  schemaMap: Map<string, ProtobufItem> = new Map();
  attachingSchema: Map<string, Set<string>> = new Map();

  constructor(protected options: ModelProtobufOptions = {}) {}

  addModel(
    model: Ark7ModelMetadata | ModelClass<any> | string,
    options: ModelProtobufAddModelOptions = {},
  ) {
    const metadata =
      model instanceof Ark7ModelMetadata ? model : A7Model.getMetadata(model);
    const file = this.getFile(metadata);
    const item = this.getItem(metadata, { file });

    if (item != null) {
      this.schemaMap.set(metadata.name, item);
      file.items.push(item);
    }
  }

  toFiles(): ModelProtobufToFile[] {
    const files: ModelProtobufToFile[] = [];

    for (const file of this.files) {
      const content: string[] = [];
      content.push('// File path: ' + file.path);
      content.push('syntax = "proto3";');
      content.push('');
      content.push(`package ${file.package};`);
      if (file.javaPackage) {
        content.push(`option java_package = "${file.javaPackage}";`);
      }

      if (!_.isEmpty(file.imports)) {
        content.push('');
        for (const imp of file.imports) {
          content.push(`import ${imp};`);
        }
      }

      for (const item of file.items) {
        content.push('');
        content.push(...this.convertItem(item));
      }

      files.push({
        path: file.path,
        content: content.join('\n'),
      });
    }

    return files;
  }

  private pushContent(content: string[], c: string, indent: number = 0) {
    let e = '';
    for (let i = 0; i < indent; i++) {
      e += '  ';
    }
    content.push(e + c);
  }

  private convertItem(item: ProtobufItem, indent: number = 0): string[] {
    const content: string[] = [];

    if (isProtobufMessage(item)) {
      this.pushContent(content, `message ${item.name} {`, indent);

      for (const nestedItem of item.nestedItems) {
        content.push(...this.convertItem(nestedItem, indent + 1));
        content.push('');
      }

      _.each(item.fields, (field, idx) => {
        this.pushContent(
          content,
          `${field.type} ${field.name} = ${idx + 1};`,
          indent + 1,
        );
      });

      this.pushContent(content, `}`, indent);
    } else {
      this.pushContent(content, `enum ${item.name} {`, indent);

      this.pushContent(
        content,
        `UNSET_${changeCase.constantCase(item.name)} = 0;`,
        indent + 1,
      );

      _.each(item.values, (value, idx) => {
        this.pushContent(content, `${value} = ${idx + 1};`, indent + 1);
      });
      this.pushContent(content, `}`, indent);
    }

    return content;
  }

  private getTypeString(
    type: runtime.Type,
    options: ModelProtobufGetTypeOptions,
  ): string {
    if (type === 'string') {
      return 'string';
    }

    if (type === 'number') {
      return 'int32';
    }

    if (runtime.isReferenceType(type)) {
      const item = this.schemaMap.get(type.referenceName);

      if (item.fileName === options.fileName) {
        if (item.location === options.location) {
          return type.referenceName;
        } else {
          return `${item.location}.${type.referenceName}`;
        }
      }

      return type.referenceName;
    }

    return 'string';
  }

  private getItem(
    metadata: Ark7ModelMetadata,
    options: ModelProtobufGetItemOptions,
  ): ProtobufItem {
    if (metadata.isEnum) {
      const protoNestedIn = metadata.configs.schema?.protoNestedIn;

      if (protoNestedIn && options.location == null) {
        if (!this.attachingSchema.has(protoNestedIn)) {
          this.attachingSchema.set(protoNestedIn, new Set());
        }

        this.attachingSchema.get(protoNestedIn).add(metadata.name);

        return null;
      } else {
        return {
          name: metadata.name,
          fileName: options.file.path,
          location: options.location,
          values: _.values((metadata.modelClass as any).enums),
        };
      }
    }

    const nestedItems = this.attachingSchema.has(metadata.name)
      ? _.map(
          Array.from(this.attachingSchema.get(metadata.name).values()),
          (name) => {
            const item = this.getItem(
              A7Model.getMetadata(name),
              _.defaults(
                {
                  location: metadata.name,
                },
                options,
              ),
            );

            this.schemaMap.set(name, item);

            return item;
          },
        )
      : [];

    return {
      name: metadata.name,
      fileName: options.file.path,
      location: '',
      fields: _.chain(Array.from(metadata.combinedFields.values()))
        .filter((field) => !field.isMethod)
        .map((field) => {
          return {
            name: field.name,
            type: this.getTypeString(field.type, {
              fileName: options.file.path,
              location: metadata.name,
              file: options.file,
            }),
          };
        })
        .value(),
      nestedItems,
    };
  }

  private getFilePath(metadata: Ark7ModelMetadata): string {
    let fileName = metadata.configs.schema?.fileName;

    if (
      fileName != null &&
      this.options.srcDir != null &&
      fileName.startsWith(this.options.srcDir)
    ) {
      fileName = fileName.substring(this.options.srcDir.length);
      if (fileName.startsWith('/')) {
        fileName = fileName.substring(1);
      }
    }

    return fileName != null
      ? fileName.replace('.ts', '.proto')
      : 'bundle.proto';
  }

  private getFile(metadata: Ark7ModelMetadata | string): ProtobufFile {
    const filename = _.isString(metadata)
      ? metadata
      : this.getFilePath(metadata as Ark7ModelMetadata);

    const path = this.options.dstDir
      ? `${this.options.dstDir}/${filename}`
      : filename;

    let file = _.find(this.files, (f: ProtobufFile) => f.path === path);

    const parts = filename.replace('.proto', '').split('/');

    const packageName = _.first(parts, parts.length - 1)
      .join('.')
      .replace(/-/g, '_');

    if (file == null) {
      file = {
        path,
        package: packageName,
        imports: [],
        items: [],
      };

      if (this.options.javaPackagePrefix != null) {
        file.javaPackage = [this.options.javaPackagePrefix, packageName].join(
          '.',
        );
      }

      this.files.push(file);
    }

    return file;
  }
}

export interface ModelProtobufOptions {
  srcDir?: string;
  dstDir?: string;
  javaPackagePrefix?: string;
}

export interface ModelProtobufAddModelOptions {}

export interface ModelProtobufToFile {
  path: string;
  content: string;
}

export interface ModelProtobufGetItemOptions {
  file: ProtobufFile;
  location?: string;
}

export interface ModelProtobufGetTypeOptions {
  fileName: string;
  location: string;
  file: ProtobufFile;
}
