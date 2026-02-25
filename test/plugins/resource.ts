import 'should';

import { A7Model, Model, StrictModel } from '../../src';
import {
  CloneOptions,
  configureResource,
  getResourceConfigs,
  ResourceHandler,
} from '../../src/plugins/resource';

// --- Test models ---

@A7Model({})
class Address extends StrictModel {
  city: string;
  zip: string;
}

@A7Model({})
class Tag extends StrictModel {
  label: string;
}

@A7Model({})
class ResourceUser extends Model {
  email: string;
  name?: string;
  address?: Address;
  tags?: Tag[];
}

@A7Model({ crud: true })
class CRUDUser extends Model {
  email: string;
  name?: string;
}

@A7Model({ singleton: true })
class AppSettings extends Model {
  theme: string;
  language?: string;
}

@A7Model({ singleton: 'tenant' })
class TenantConfig extends Model {
  tenant: string;
  feature: string;
}

describe('resource', () => {
  describe('$metadata', () => {
    it('returns metadata for the instance', () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
      });

      const metadata = user.$metadata();
      metadata.name.should.be.equal('ResourceUser');
      metadata.combinedFields.has('email').should.be.true();
      metadata.combinedFields.has('address').should.be.true();
    });
  });

  describe('$set', () => {
    it('sets a simple field', () => {
      const user = ResourceUser.modelize({ email: 'old@example.com' });
      user.$set('email', 'new@example.com');
      user.email.should.be.equal('new@example.com');
    });

    it('sets a nested field via dot notation', () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        address: { city: 'LA', zip: '90001' },
      });

      user.$set('address.city', 'NYC');
      user.address.city.should.be.equal('NYC');
      user.address.zip.should.be.equal('90001');
    });

    it('creates intermediate object if null', () => {
      const user = ResourceUser.modelize({ email: 'test@example.com' });

      user.$set('address.city', 'NYC');
      user.address.should.be.instanceof(Address);
      user.address.city.should.be.equal('NYC');
    });

    it('modelizes the value for known fields', () => {
      const user = ResourceUser.modelize({ email: 'test@example.com' });

      user.$set('address', { city: 'NYC', zip: '10001' });
      user.address.should.be.instanceof(Address);
    });

    it('marks the instance as $dirty', () => {
      const user = ResourceUser.modelize({ email: 'test@example.com' });

      user.$set('email', 'changed@example.com');
      (user.$attach() as any).$dirty.should.be.true();
    });

    it('returns this for chaining', () => {
      const user = ResourceUser.modelize({ email: 'test@example.com' });

      const result = user.$set('email', 'a@b.com');
      result.should.be.exactly(user);
    });
  });

  describe('$root', () => {
    it('returns self when no parent', () => {
      const user = ResourceUser.modelize({ email: 'test@example.com' });

      user.$root().should.be.exactly(user);
    });

    it('returns parent for nested model', () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        address: { city: 'NYC', zip: '10001' },
      });

      user.address.$root().should.be.exactly(user);
    });
  });

  describe('$clone', () => {
    it('creates a shallow clone without _id', () => {
      const user = ResourceUser.modelize({
        _id: '123' as any,
        email: 'test@example.com',
      });

      const clone = user.$clone();
      clone.should.not.be.exactly(user);
      clone.email.should.be.equal('test@example.com');
      (clone._id == null).should.be.true();
      clone.should.be.instanceof(ResourceUser);
    });

    it('preserves _id with withId option', () => {
      const user = ResourceUser.modelize({
        _id: '123' as any,
        email: 'test@example.com',
      });

      const clone = user.$clone({ withId: true });
      String(clone._id).should.be.equal('123');
    });

    it('creates a deep clone', () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        address: { city: 'NYC', zip: '10001' },
      });

      const clone = user.$clone({ deep: true });
      clone.should.not.be.exactly(user);
      clone.address.should.not.be.exactly(user.address);
      clone.address.city.should.be.equal('NYC');
      clone.should.be.instanceof(ResourceUser);
      clone.address.should.be.instanceof(Address);
    });
  });

  describe('$copy', () => {
    it('creates a clone with overrides', () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        name: 'Alice',
      });

      const copy = user.$copy({ name: 'Bob' });
      copy.should.not.be.exactly(user);
      copy.name.should.be.equal('Bob');
      copy.email.should.be.equal('test@example.com');
    });
  });

  describe('$processResponse', () => {
    it('patches instance with response data', async () => {
      const user = ResourceUser.modelize({
        email: 'old@example.com',
        name: 'Alice',
      });

      const response = ResourceUser.modelize({
        email: 'new@example.com',
        name: 'Bob',
      });

      await user.$processResponse(response);
      user.email.should.be.equal('new@example.com');
      user.name.should.be.equal('Bob');
    });

    it('removes keys not present in response', async () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        name: 'Alice',
      });

      const response = ResourceUser.modelize({
        email: 'test@example.com',
      });

      await user.$processResponse(response);
      user.email.should.be.equal('test@example.com');
      (user.name == null).should.be.true();
    });

    it('patches array fields', async () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        tags: [{ label: 'a' }, { label: 'b' }],
      });

      const response = ResourceUser.modelize({
        email: 'test@example.com',
        tags: [{ label: 'a' }, { label: 'b' }, { label: 'c' }],
      });

      await user.$processResponse(response);
      user.tags.length.should.be.equal(3);
      user.tags[2].label.should.be.equal('c');
    });

    it('shrinks array fields', async () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        tags: [{ label: 'a' }, { label: 'b' }, { label: 'c' }],
      });

      const response = ResourceUser.modelize({
        email: 'test@example.com',
        tags: [{ label: 'a' }],
      });

      await user.$processResponse(response);
      user.tags.length.should.be.equal(1);
    });
  });

  describe('$update / $save / $delete', () => {
    let lastUpdate: { instance: any; obj: any } | null = null;
    let lastRemove: { instance: any } | null = null;
    let updateResponse: any = null;
    let removeResponse: any = null;

    before(() => {
      configureResource({
        handler: {
          async update(instance, obj) {
            lastUpdate = { instance, obj };
            return updateResponse;
          },
          async remove(instance) {
            lastRemove = { instance };
            return removeResponse;
          },
        },
      });
    });

    beforeEach(() => {
      lastUpdate = null;
      lastRemove = null;
      updateResponse = null;
      removeResponse = null;
    });

    after(() => {
      configureResource({ handler: undefined });
    });

    it('$update calls handler and processes response', async () => {
      const user = ResourceUser.modelize({
        _id: '123' as any,
        email: 'old@example.com',
      });

      updateResponse = ResourceUser.modelize({
        _id: '123' as any,
        email: 'new@example.com',
      });

      await user.$update({ email: 'new@example.com' });

      lastUpdate.obj.should.be.deepEqual({ email: 'new@example.com' });
      user.email.should.be.equal('new@example.com');
    });

    it('$save sends full toJSON', async () => {
      const user = ResourceUser.modelize({
        _id: '456' as any,
        email: 'test@example.com',
      });

      updateResponse = ResourceUser.modelize({
        _id: '456' as any,
        email: 'test@example.com',
      });

      await user.$save();

      lastUpdate.obj.should.have.property('email', 'test@example.com');
    });

    it('$delete calls handler.remove', async () => {
      const user = ResourceUser.modelize({
        _id: '789' as any,
        email: 'test@example.com',
      });

      removeResponse = null;

      await user.$delete();

      lastRemove.instance.should.be.exactly(user);
    });

    it('throws when no handler configured', async () => {
      configureResource({ handler: undefined });

      const user = ResourceUser.modelize({ email: 'test@example.com' });

      await user.$update({ email: 'x' }).should.be.rejectedWith(
        /No ResourceHandler configured/,
      );

      await user.$delete().should.be.rejectedWith(
        /No ResourceHandler configured/,
      );
    });

    it('nested $update prefixes keys to parent', async () => {
      configureResource({
        handler: {
          async update(instance, obj) {
            lastUpdate = { instance, obj };
            return updateResponse;
          },
          async remove(instance) {
            lastRemove = { instance };
            return removeResponse;
          },
        },
      });

      const user = ResourceUser.modelize({
        _id: 'u1' as any,
        email: 'test@example.com',
        address: { city: 'LA', zip: '90001' },
      });

      updateResponse = ResourceUser.modelize({
        _id: 'u1' as any,
        email: 'test@example.com',
        address: { city: 'NYC', zip: '90001' },
      });

      await user.address.$update({ city: 'NYC' });

      lastUpdate.obj.should.be.deepEqual({ 'address.city': 'NYC' });
    });
  });

  describe('configureResource / getResourceConfigs', () => {
    it('merges configs', () => {
      const handler: ResourceHandler = {
        async update() {},
        async remove() {},
      };

      configureResource({ handler });
      getResourceConfigs().handler.should.be.exactly(handler);
    });
  });

  describe('modelize override', () => {
    it('always attaches field metadata', () => {
      const user = ResourceUser.modelize({
        email: 'test@example.com',
        address: { city: 'NYC', zip: '10001' },
      });

      // address should have $parent attached
      const attach = user.address.$attach() as any;
      attach.should.have.property('$parent');
      attach.$parent.should.be.exactly(user);
      attach.$path.should.be.equal('address');
    });
  });

  describe('CRUD static methods', () => {
    let lastCreate: { modelClass: any; data: any } | null = null;
    let lastGet: { modelClass: any; id: any } | null = null;
    let lastQuery: { modelClass: any; params: any } | null = null;
    let lastRemove: { instance: any } | null = null;

    before(() => {
      configureResource({
        handler: {
          async update() {},
          async remove(instance) {
            lastRemove = { instance };
            return null;
          },
          async create(modelClass, data) {
            lastCreate = { modelClass, data };
            return { _id: 'new-id', ...data };
          },
          async get(modelClass, id) {
            lastGet = { modelClass, id };
            return { _id: id, email: 'found@example.com' };
          },
          async query(modelClass, params) {
            lastQuery = { modelClass, params };
            return [
              { _id: '1', email: 'a@example.com' },
              { _id: '2', email: 'b@example.com' },
            ];
          },
        },
      });
    });

    beforeEach(() => {
      lastCreate = null;
      lastGet = null;
      lastQuery = null;
      lastRemove = null;
    });

    after(() => {
      configureResource({ handler: undefined });
    });

    it('Model.create calls handler and returns modelized instance', async () => {
      const user = await CRUDUser.create({
        email: 'new@example.com',
        name: 'Alice',
      });

      lastCreate.modelClass.should.be.exactly(CRUDUser);
      lastCreate.data.should.be.deepEqual({
        email: 'new@example.com',
        name: 'Alice',
      });
      user.should.be.instanceof(CRUDUser);
      user.email.should.be.equal('new@example.com');
      String(user._id).should.be.equal('new-id');
    });

    it('Model.get calls handler and returns modelized instance', async () => {
      const user = await CRUDUser.get('123');

      lastGet.modelClass.should.be.exactly(CRUDUser);
      lastGet.id.should.be.equal('123');
      user.should.be.instanceof(CRUDUser);
      user.email.should.be.equal('found@example.com');
    });

    it('Model.query calls handler and returns modelized array', async () => {
      const users = await CRUDUser.query({ name: 'test' });

      lastQuery.modelClass.should.be.exactly(CRUDUser);
      lastQuery.params.should.be.deepEqual({ name: 'test' });
      users.should.have.length(2);
      users[0].should.be.instanceof(CRUDUser);
      users[1].should.be.instanceof(CRUDUser);
      users[0].email.should.be.equal('a@example.com');
      users[1].email.should.be.equal('b@example.com');
    });

    it('Model.query works without params', async () => {
      const users = await CRUDUser.query();

      lastQuery.modelClass.should.be.exactly(CRUDUser);
      (lastQuery.params == null).should.be.true();
      users.should.have.length(2);
    });

    it('Model.remove delegates to handler.remove with stub instance', async () => {
      await CRUDUser.remove('456');

      lastRemove.instance.should.be.instanceof(CRUDUser);
      String(lastRemove.instance._id).should.be.equal('456');
    });

    it('throws when no handler configured', async () => {
      configureResource({ handler: undefined });

      await (CRUDUser as any)
        .create({ email: 'x' })
        .should.be.rejectedWith(/No ResourceHandler configured/);

      await (CRUDUser as any)
        .get('1')
        .should.be.rejectedWith(/No ResourceHandler configured/);

      await (CRUDUser as any)
        .query()
        .should.be.rejectedWith(/No ResourceHandler configured/);

      await (CRUDUser as any)
        .remove('1')
        .should.be.rejectedWith(/No ResourceHandler configured/);
    });

    it('static methods are inherited by subclasses', async () => {
      configureResource({
        handler: {
          async update() {},
          async remove() { return null; },
          async create(modelClass, data) {
            lastCreate = { modelClass, data };
            return { _id: 'sub-id', ...data };
          },
          async get() {
            return { _id: '1', email: 'test@example.com' };
          },
          async query() {
            return [];
          },
        },
      });

      // ResourceUser extends Model — static methods inherited via prototype chain
      const user = await ResourceUser.create({
        email: 'sub@example.com',
      });

      lastCreate.modelClass.should.be.exactly(ResourceUser);
      user.should.be.instanceof(ResourceUser);
      user.email.should.be.equal('sub@example.com');
    });
  });

  describe('Singleton static methods', () => {
    let lastFindOne: { modelClass: any; query: any } | null = null;
    let lastUpdate: { instance: any; obj: any } | null = null;

    before(() => {
      configureResource({
        handler: {
          async update(instance, obj) {
            lastUpdate = { instance, obj };
            return AppSettings.modelize({
              _id: 'singleton-1',
              ...instance.toJSON(),
              ...obj,
            } as any);
          },
          async remove() { return null; },
          async findOne(modelClass, query) {
            lastFindOne = { modelClass, query };
            return { _id: 'singleton-1', theme: 'dark', language: 'en' };
          },
        },
      });
    });

    beforeEach(() => {
      lastFindOne = null;
      lastUpdate = null;
    });

    after(() => {
      configureResource({ handler: undefined });
    });

    it('Model.sGet calls handler.findOne with empty query when singleton: true', async () => {
      const settings = await AppSettings.sGet();

      lastFindOne.modelClass.should.be.exactly(AppSettings);
      lastFindOne.query.should.be.deepEqual({});
      settings.should.be.instanceof(AppSettings);
      settings.theme.should.be.equal('dark');
      settings.language.should.be.equal('en');
    });

    it('Model.sGet builds keyed query when singleton is a string', async () => {
      configureResource({
        handler: {
          async update(instance, obj) {
            lastUpdate = { instance, obj };
            return TenantConfig.modelize({
              _id: 'tc-1',
              ...instance.toJSON(),
              ...obj,
            } as any);
          },
          async remove() { return null; },
          async findOne(modelClass, query) {
            lastFindOne = { modelClass, query };
            return { _id: 'tc-1', tenant: 'acme', feature: 'billing' };
          },
        },
      });

      const config = await TenantConfig.sGet('acme');

      lastFindOne.modelClass.should.be.exactly(TenantConfig);
      lastFindOne.query.should.be.deepEqual({ tenant: 'acme' });
      config.should.be.instanceof(TenantConfig);
      config.tenant.should.be.equal('acme');
      config.feature.should.be.equal('billing');
    });

    it('Model.sUpdate composes sGet + $update', async () => {
      // Restore AppSettings handler
      configureResource({
        handler: {
          async update(instance, obj) {
            lastUpdate = { instance, obj };
            return AppSettings.modelize({
              _id: 'singleton-1',
              ...instance.toJSON(),
              ...obj,
            } as any);
          },
          async remove() { return null; },
          async findOne(modelClass, query) {
            lastFindOne = { modelClass, query };
            return { _id: 'singleton-1', theme: 'dark', language: 'en' };
          },
        },
      });

      const settings = await AppSettings.sUpdate({
        language: 'fr',
      });

      // findOne should have been called first
      lastFindOne.modelClass.should.be.exactly(AppSettings);
      lastFindOne.query.should.be.deepEqual({});

      // Then $update should have called handler.update
      lastUpdate.obj.should.be.deepEqual({ language: 'fr' });
      settings.should.be.instanceof(AppSettings);
    });

    it('Model.sUpdate passes val to build keyed query', async () => {
      configureResource({
        handler: {
          async update(instance, obj) {
            lastUpdate = { instance, obj };
            return TenantConfig.modelize({
              _id: 'tc-1',
              ...instance.toJSON(),
              ...obj,
            } as any);
          },
          async remove() { return null; },
          async findOne(modelClass, query) {
            lastFindOne = { modelClass, query };
            return { _id: 'tc-1', tenant: 'ops', feature: 'old' };
          },
        },
      });

      await TenantConfig.sUpdate({ feature: 'new' }, 'ops');

      lastFindOne.query.should.be.deepEqual({ tenant: 'ops' });
      lastUpdate.obj.should.be.deepEqual({ feature: 'new' });
    });

    it('throws when handler.findOne is not implemented', async () => {
      configureResource({
        handler: {
          async update() {},
          async remove() { return null; },
        },
      });

      await (AppSettings as any)
        .sGet()
        .should.be.rejectedWith(/findOne is not implemented/);

      await (AppSettings as any)
        .sUpdate({ theme: 'x' })
        .should.be.rejectedWith(/findOne is not implemented/);
    });
  });
});
