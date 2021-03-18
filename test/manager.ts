import 'should';

import { A7Model, Model, Ref, StrictModel, manager } from '../src';

export enum ManagerEnumStatus {
  NONE = 'NONE',
}
A7Model.provide(ManagerEnumStatus);

@A7Model({})
export class ManagerModel3 extends StrictModel {
  fm1: string;
}

@A7Model({})
export class ManagerModel4 extends StrictModel {
  fm1: string;

  fm2: Ref<ManagerModel2>[];
}

@A7Model({})
export class ManagerModel1 extends Model {
  f1: string;

  status: ManagerEnumStatus;
}

@A7Model({})
export class ManagerModel2 extends ManagerModel1 {
  f2: string;

  f3: ManagerModel3[];

  f4: Ref<ManagerModel4>;
}

describe('manager', () => {
  describe('#mermaid', () => {
    it('should return from seed class', () => {
      const uml = manager.UML({
        seedClasses: ['ManagerModel2'],
        enums: {
          enabled: true,
        },
        fields: {
          includeInherits: true,
        },
      });

      uml.should.be.eql(`classDiagram

ManagerModel2 *-- ManagerModel3
ManagerModel2 <--o ManagerModel4
ManagerModel2 *-- ManagerEnumStatus
ManagerModel1 *-- ManagerEnumStatus
ManagerModel1 <|-- ManagerModel2

class ManagerEnumStatus {
  <<enumeration>>
}
ManagerEnumStatus : NONE

class ManagerModel1 {
  <<model>>
}
ManagerModel1 : ID _id
ManagerModel1 : string f1
ManagerModel1 : ManagerEnumStatus status

class ManagerModel2 {
  <<model>>
}
ManagerModel2 : ID _id
ManagerModel2 : string f1
ManagerModel2 : string f2
ManagerModel2 : ManagerModel3[] f3
ManagerModel2 : Ref<ManagerModel4> f4
ManagerModel2 : ManagerEnumStatus status

ManagerModel3 : string fm1

ManagerModel4 : string fm1
ManagerModel4 : Ref<ManagerModel2>[] fm2
`);
    });
  });
});
