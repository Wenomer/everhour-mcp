import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { everhourFetch } from '../src/everhour-client.js';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('EVERHOUR_API_KEY', 'test-key');
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/** Build a minimal Response-like object for the mock to resolve with. */
function makeResponse(
  status: number,
  body = '',
  headers: Record<string, string> = {},
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
    headers: new Headers(headers),
  } as unknown as Response;
}

describe('everhourFetch success paths', () => {
  it('parses a JSON body', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, JSON.stringify({ id: 1 })));
    await expect(everhourFetch('/users/me')).resolves.toEqual({ id: 1 });
  });

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(makeResponse(204));
    await expect(everhourFetch('/time/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('sends the API key and passes an abort signal', async () => {
    fetchMock.mockResolvedValue(makeResponse(200, '{}'));
    await everhourFetch('/users/me');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['X-Api-Key']).toBe('test-key');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('everhourFetch when the API is unavailable', () => {
  it('surfaces the underlying network cause instead of a bare "fetch failed"', async () => {
    const err = new TypeError('fetch failed');
    (err as Error & { cause?: unknown }).cause = new Error('ECONNREFUSED');
    fetchMock.mockRejectedValue(err);

    await expect(everhourFetch('/users/me')).rejects.toThrow(/could not reach the server/);
    await expect(everhourFetch('/users/me')).rejects.toThrow(/ECONNREFUSED/);
  });

  it('reports a timeout distinctly', async () => {
    fetchMock.mockRejectedValue(
      new DOMException('The operation timed out', 'TimeoutError'),
    );
    await expect(everhourFetch('/users/me')).rejects.toThrow(/timed out after \d+ms/);
  });

  it('honours EVERHOUR_TIMEOUT_MS in the timeout message', async () => {
    vi.stubEnv('EVERHOUR_TIMEOUT_MS', '5000');
    fetchMock.mockRejectedValue(
      new DOMException('The operation timed out', 'TimeoutError'),
    );
    await expect(everhourFetch('/users/me')).rejects.toThrow(/timed out after 5000ms/);
  });
});

describe('everhourFetch on HTTP errors', () => {
  it('includes status and body for a 5xx', async () => {
    fetchMock.mockResolvedValue(makeResponse(503, 'service down'));
    await expect(everhourFetch('/projects')).rejects.toThrow(
      /GET \/projects → 503: service down/,
    );
  });

  it('surfaces Retry-After on a 429', async () => {
    fetchMock.mockResolvedValue(
      makeResponse(429, 'slow down', { 'retry-after': '12' }),
    );
    await expect(everhourFetch('/projects')).rejects.toThrow(
      /429 \(rate limited — retry after 12s\)/,
    );
  });
});
