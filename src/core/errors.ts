export class MetadataError extends Error {
  constructor(public key: string) {
    super(`Metadata ${key} not set`);
  }
}
