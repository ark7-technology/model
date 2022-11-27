import 'should';

import { A7Model, EncryptAlgorithm, Encrypted } from '../src';

describe('encrypted', () => {
  @A7Model({})
  class EncryptedModel {
    @Encrypted() field1: string;

    @Encrypted({
      algorithm: EncryptAlgorithm.AEAD_AES_256_CBC_HMAC_SHA_512_RANDOM,
    })
    field2: string;

    @Encrypted({ keyAltName: 'anotherDataKeyName', autoDecrypt: true })
    field3: string;
  }

  it('specifies the encrypted', () => {
    A7Model.getMetadata(EncryptedModel).should.have.properties({
      name: 'EncryptedModel',
      modelClass: EncryptedModel.prototype.constructor,
      superClass: null,
      configs: {
        schema: {
          name: 'EncryptedModel',
          props: [
            {
              name: 'field1',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
            },
            {
              name: 'field2',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
            },
            {
              name: 'field3',
              optional: false,
              modifier: 'PUBLIC',
              type: 'string',
            },
          ],
          fileName: 'test/encrypted.ts',
        },
      },
      fields: {
        field1: {
          name: 'field1',
          options: {
            encrypted: true,
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
            keyAltName: 'defaultDataKey',
            autoDecrypt: false,
          },
        },
        field2: {
          name: 'field2',
          options: {
            encrypted: true,
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
            keyAltName: 'defaultDataKey',
            autoDecrypt: false,
          },
        },
        field3: {
          name: 'field3',
          options: {
            encrypted: true,
            algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
            keyAltName: 'anotherDataKeyName',
            autoDecrypt: true,
          },
        },
      },
    });
  });
});
