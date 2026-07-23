const BASE_URL = 'https://api.everhour.com';

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

  const res = await fetch(url, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `Everhour API ${init?.method ?? 'GET'} ${path} → ${res.status}: ${body}`,
    );
  }

  return body ? (JSON.parse(body) as T) : (undefined as T);
}
