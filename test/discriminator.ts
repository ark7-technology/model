import 'should';

import { A7Model, StrictModel } from '../src';

@A7Model({
  discriminatorKey: 'kind',
})
class EventModel extends StrictModel {
  kind?: string;
}

@A7Model({})
class MouseEvent extends EventModel {
  foo: string;
}

describe('discriminator', () => {
  describe('.getMetadata()', () => {
    it('should return right metadata for EventModel', () => {
      A7Model.getMetadata(MouseEvent).should.have.properties({
        name: 'MouseEvent',
        modelClass: MouseEvent.prototype.constructor,
        superClass: EventModel.prototype.constructor,
        discriminations: [],
        configs: {
          schema: {
            name: 'MouseEvent',
            props: [
              {
                name: 'foo',
                optional: false,
                modifier: 'PUBLIC',
                type: 'string',
              },
            ],
            fileName: process.cwd() + '/test/discriminator.ts',
          },
          discriminatorKey: 'kind',
        },
        fields: {},
      });
      A7Model.getMetadata(EventModel).should.have.properties({
        name: 'EventModel',
        modelClass: EventModel.prototype.constructor,
        superClass: StrictModel.prototype.constructor,
        discriminations: [MouseEvent.prototype.constructor],
        configs: {
          schema: {
            name: 'EventModel',
            props: [
              {
                name: 'kind',
                optional: true,
                modifier: 'PUBLIC',
                type: 'string',
              },
            ],
            fileName: process.cwd() + '/test/discriminator.ts',
          },
          discriminatorKey: 'kind',
        },
        fields: {},
      });
    });
  });

  describe('.modelize()', () => {
    it('should be able to parse', () => {
      const ins = EventModel.modelize({
        kind: 'MouseEvent',
        foo: 'bar',
      } as any);

      ins.should.be.instanceof(MouseEvent);

      const ins2 = MouseEvent.modelize({
        foo: 'bar',
      });

      ins2.should.be.instanceof(MouseEvent);

      ins2.toObject().should.be.deepEqual({
        kind: 'MouseEvent',
        foo: 'bar',
      });
    });
  });
});
