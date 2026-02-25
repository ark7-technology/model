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
});
