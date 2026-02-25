import { StrictModel } from '../../core';
import { ResourceHandler, ResourceHandlerOptions } from './types';

/**
 * Options for configuring a {@link WebHandler}.
 */
export interface WebHandlerOptions {
  /** Base URL of the API server (e.g. `'https://api.example.com'`). */
  host: string;

  /**
   * URL path prefix prepended to all requests
   * (e.g. `'/api/v1'`). Defaults to `''`.
   */
  prefix?: string;

  /**
   * Bearer token for `Authorization` header. Sets
   * `Authorization: Bearer <authToken>` on every request.
   */
  authToken?: string;

  /**
   * If true, sets `credentials: 'include'` on every request for
   * cookie-based authentication in browser environments.
   */
  credentials?: boolean;
}

let _fetch: typeof globalThis.fetch;

async function resolveFetch(): Promise<typeof globalThis.fetch> {
  if (_fetch != null) return _fetch;

  if (typeof globalThis.fetch !== 'undefined') {
    _fetch = globalThis.fetch;
  } else {
    _fetch = (await import('node-fetch' as any)).default;
  }

  return _fetch;
}

/**
 * A {@link ResourceHandler} implementation that uses `fetch` to communicate
 * with a REST API.
 *
 * URL pattern: `${host}${prefix}/${options.path}[/${id}]`
 *
 * HTTP method mapping:
 * - `create`  → `POST   /{path}`
 * - `get`     → `GET    /{path}/{id}`
 * - `query`   → `GET    /{path}?params`
 * - `findOne` → `GET    /{path}?query`
 * - `update`  → `POST   /{path}/{id}`
 * - `remove`  → `DELETE /{path}/{id}`
 *
 * @example
 * ```typescript
 * import { configureResource, WebHandler } from '@ark7/model/resource';
 *
 * // Token-based auth
 * configureResource({
 *   handler: new WebHandler({
 *     host: 'https://api.example.com',
 *     prefix: '/api/v1',
 *     authToken: '<token>',
 *   }),
 * });
 *
 * // Cookie-based auth (browser)
 * configureResource({
 *   handler: new WebHandler({
 *     host: 'https://api.example.com',
 *     credentials: true,
 *   }),
 * });
 * ```
 */
export class WebHandler implements ResourceHandler {
  constructor(private opts: WebHandlerOptions) {}

  private url(path: string, ...segments: string[]): string {
    const base = this.opts.prefix
      ? `${this.opts.host}${this.opts.prefix}`
      : this.opts.host;
    const parts = [base, path, ...segments].filter(Boolean);
    return parts.join('/');
  }

  private async request(url: string, init?: RequestInit): Promise<any> {
    const fetchFn = await resolveFetch();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    };

    if (this.opts.authToken) {
      headers['Authorization'] = `Bearer ${this.opts.authToken}`;
    }

    const response = await fetchFn(url, {
      ...init,
      headers,
      credentials: this.opts.credentials ? 'include' : undefined,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `${response.status} ${response.statusText}: ${init?.method ?? 'GET'} ${url}${body ? '\n' + body : ''}`,
      );
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // --- Instance-level ---

  async update(
    options: ResourceHandlerOptions,
    obj: object,
    instance: StrictModel,
  ): Promise<any> {
    return this.request(
      this.url(options.path, String((instance as any)._id)),
      { method: 'POST', body: JSON.stringify(obj) },
    );
  }

  async remove(
    options: ResourceHandlerOptions,
    instance: StrictModel,
  ): Promise<any> {
    return this.request(
      this.url(options.path, String((instance as any)._id)),
      { method: 'DELETE' },
    );
  }

  // --- CRUD class-level ---

  async create(
    options: ResourceHandlerOptions,
    data: object,
  ): Promise<any> {
    return this.request(this.url(options.path), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get(options: ResourceHandlerOptions, id: any): Promise<any> {
    return this.request(this.url(options.path, String(id)));
  }

  async query(
    options: ResourceHandlerOptions,
    params?: object,
  ): Promise<any[]> {
    let url = this.url(options.path);

    if (params != null && Object.keys(params).length > 0) {
      const qs = Object.entries(params)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join('&');
      url += '?' + qs;
    }

    return this.request(url);
  }

  // --- Singleton ---

  async findOne(
    options: ResourceHandlerOptions,
    query: object,
  ): Promise<any> {
    let url = this.url(options.path);

    if (Object.keys(query).length > 0) {
      const qs = Object.entries(query)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join('&');
      url += '?' + qs;
    }

    return this.request(url);
  }
}
