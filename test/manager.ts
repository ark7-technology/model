import 'should';

import { A7Model, Ref, StrictModel, manager } from '../src';

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
}

@A7Model({})
export class ManagerModel1 extends StrictModel {
  f1: string;

  status: ManagerEnumStatus;
}

@A7Model({})
export class ManagerModel2 extends ManagerModel1 {
  f2: string;

  f3: ManagerModel3;

  f4: Ref<ManagerModel4>;
}

describe('manager', () => {
  describe('#mermaid', () => {
    it('should return from seed class', () => {
      const uml = manager.UML({
        seedClasses: ['ManagerModel2'],
      });

      uml.should.be.eql(`ManagerModel1 <|-- ManagerModel2

ManagerModel1 : string f1
ManagerModel1 : ManagerEnumStatus status

ManagerModel2 : string f2
ManagerModel2 : ManagerModel3 f3
ManagerModel2 : Ref<ManagerModel4> f4
ManagerModel2 : string f1
ManagerModel2 : ManagerEnumStatus status`);
    });
  });
});
