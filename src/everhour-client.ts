const BASE_URL = 'https://api.everhour.com';
const DEFAULT_TIMEOUT_MS = 30_000;

/** Request timeout in ms, overridable via EVERHOUR_TIMEOUT_MS (falls back to 30s). */
function getTimeoutMs(): number {
  const raw = process.env.EVERHOUR_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

/**
 * Build a query string from a set of params, skipping any that are `undefined`.
 * Returns a leading "?" when there is at least one param, or "" otherwise.
 */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function getApiKey(): string {
  const key = process.env.EVERHOUR_API_KEY;
  if (!key) {
    throw new Error(
      'EVERHOUR_API_KEY environment variable is not set. ' +
        'Pass it via the "env" section in your mcp.json config.',
    );
  }
  return key;
}

export async function everhourFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'X-Api-Key': getApiKey(),
    'Content-Type': 'application/json',
    'User-Agent': 'everhour-mcp/1.0.0',
    'X-Accept-Version': '1.2',
    ...(init?.headers as Record<string, string> | undefined),
  };

  const method = init?.method ?? 'GET';
  const timeoutMs = getTimeoutMs();

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // fetch() rejects on network failure, DNS errors, or the timeout abort.
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error(
        `Everhour API ${method} ${path} timed out after ${timeoutMs}ms. ` +
          'The service may be unavailable; try again or raise EVERHOUR_TIMEOUT_MS.',
      );
    }
    // Surface the underlying cause (e.g. ECONNREFUSED, ENOTFOUND) which fetch
    // hides behind a generic "fetch failed" message.
    const cause = err instanceof Error && err.cause ? ` (${String(err.cause)})` : '';
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Everhour API ${method} ${path} could not reach the server: ${reason}${cause}`,
    );
  }

  if (res.status === 204) return undefined as T;

  const body = await res.text();

  if (!res.ok) {
    const retryAfter = res.headers.get('retry-after');
    const retryHint =
      res.status === 429 && retryAfter
        ? ` (rate limited — retry after ${retryAfter}s)`
        : '';
    throw new Error(
      `Everhour API ${method} ${path} → ${res.status}${retryHint}: ${body}`,
    );
  }

  return body ? (JSON.parse(body) as T) : (undefined as T);
}
