export class MetadataError extends Error {
  constructor(public key: string) {
    super(`Metadata ${key} not set`);
  }
}

export class ModelizeError extends Error {
  constructor(public path: string, public cls: any, public cause: Error) {
    super(`Modelize failed with path ${path}, caused by:\n${cause.stack}`);
  }

  static fromNested(err: ModelizeError, cls: any, pathPrefix: string) {
    return new ModelizeError(
      `${pathPrefix}${err.cls ? `:${err.cls.name}` : ''}.${err.path}`,
      cls,
      err.cause,
    );
  }
}
