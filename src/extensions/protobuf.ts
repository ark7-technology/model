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
  fields: ProtobufMessageField[];
  nestedItems: ProtobufItem[];
}

export interface ProtobufEnum {
  name: string;
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

  constructor(protected options: ModelProtobufOptions = {}) {}

  addModel(
    model: Ark7ModelMetadata | ModelClass<any> | string,
    options: ModelProtobufAddModelOptions = {},
  ) {
    const metadata =
      model instanceof Ark7ModelMetadata ? model : A7Model.getMetadata(model);
    const file = this.getFile(metadata);
    file.items.push(this.getItem(metadata));
  }

  saveFiles() {
    const fileString: string[] = [];
    for (const file of this.files) {
      let content: string[] = [];
      content.push('// File path: ' + file.path);

      content.push('');
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

      fileString.push(content.join('\n'));
    }

    return fileString;
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

  private getTypeString(type: runtime.Type): string {
    if (type === 'string') {
      return 'string';
    }

    if (type === 'number') {
      return 'int32';
    }

    if (runtime.isReferenceType(type)) {
      return type.referenceName;
    }

    return 'string';
  }

  private getItem(metadata: Ark7ModelMetadata): ProtobufItem {
    return metadata.isEnum
      ? {
          name: metadata.name,
          values: _.values((metadata.modelClass as any).enums),
        }
      : {
          name: metadata.name,
          fields: _.map(Array.from(metadata.combinedFields.keys()), (key) => {
            const field = metadata.combinedFields.get(key);
            return {
              name: field.name,
              type: this.getTypeString(field.type),
            };
          }),
          nestedItems: [],
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
    const packageName = _.first(parts, parts.length - 1).join('.');

    if (file == null) {
      file = {
        path,
        package: packageName,
        imports: [],
        items: [],
      };

      this.files.push(file);
    }

    return file;
  }
}

export interface ModelProtobufOptions {
  srcDir?: string;
  dstDir?: string;
}

export interface ModelProtobufAddModelOptions {}
