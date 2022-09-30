import { Field } from '../fields';
import * as _ from 'underscore';

/**
 * Indicate a encrypted field.
 */
export function Encrypted(
  options: EncryptedFieldOptions = {},
): PropertyDecorator {
  return Field<EncryptedFieldMetadata>(
    _.defaults(options, {
      encrypted: true,
      algorithm: EncryptAlgorithm.AEAD_AES_256_CBC_HMAC_SHA_512_DETERMINISTIC,
      keyAltName: 'defaultDataKey',
      autoDecrypt: false,
    }),
  );
}

export enum EncryptAlgorithm {
  AEAD_AES_256_CBC_HMAC_SHA_512_DETERMINISTIC = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
  AEAD_AES_256_CBC_HMAC_SHA_512_RANDOM = 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
  INDEXED = 'Indexed',
  UNINDEXED = 'Unindexed',
}

export interface EncryptedFieldOptions {
  /**
   * The algorithm to use for encryption. defaults to 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
   */
  algorithm?: EncryptAlgorithm;

  /**
   * A unique string name corresponding to an already existing dataKey. defaults to 'defaultDataKey'
   */
  keyAltName?: string;

  /**
   * whether auto decrypt the field. defaults to false
   */
  autoDecrypt?: boolean;
}

export interface EncryptedFieldMetadata extends EncryptedFieldOptions {
  encrypted: boolean;
}
