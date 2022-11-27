import 'should';

import { A7Model } from '../src';
import { ModelProtobuf } from '../src/extensions/protobuf';

enum ProtobufTestEnum {
  HELLO = 'HELLO',
  WORLD = 'WORLD',
}
A7Model.provide(ProtobufTestEnum, { protoNestedIn: 'ProtobufTestModel1' });

@A7Model({})
class ProtobufTestModel1 {
  field1: string;
  field2: number;
  enum3: ProtobufTestEnum;
}

@A7Model({})
class ProtobufTestModel2 {
  enum4: ProtobufTestEnum;
}

describe('protobuf', () => {
  it('generates normal class', () => {
    const buf = new ModelProtobuf({
      srcDir: process.cwd(),
      dstDir: './dist/proto',
    });

    buf.addModel('ProtobufTestEnum');
    buf.addModel(ProtobufTestModel1);
    buf.addModel(ProtobufTestModel2);

    for (const content of buf.toFiles()) {
      console.log(content.path);
      console.log(content.content);
    }
  });
});
