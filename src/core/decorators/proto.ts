import { Field } from '../fields';

export function Proto(options: ProtoFieldOptions): PropertyDecorator {
  return Field<ProtoFieldOptions>(options);
}

export interface ProtoFieldOptions {
  protoFieldType?: 'none' | 'int32' | 'int64' | 'string' | 'float' | 'double';
  protoAssignedId?: number;
}
