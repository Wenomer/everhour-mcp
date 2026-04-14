const BASE_URL = 'https://api.everhour.com';

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
