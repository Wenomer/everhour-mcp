import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the client module but keep the real buildQuery so the tools still build
// their query strings correctly; only the network call is stubbed out.
vi.mock('../src/everhour-client.js', async (importActual) => {
  const actual = await importActual<typeof import('../src/everhour-client.js')>();
  return { ...actual, everhourFetch: vi.fn() };
});

import { everhourFetch } from '../src/everhour-client.js';
import { registerAllTools, getTool } from './helpers.js';

const fetchMock = vi.mocked(everhourFetch);
const tools = registerAllTools();

/** Convenience: call a tool's handler and return the text of its first block. */
async function callText(name: string, args: Record<string, unknown>): Promise<string> {
  const result = await getTool(tools, name).handler(args);
  return result.content[0].text;
}

/** The path passed to the most recent everhourFetch call. */
function lastPath(): string {
  return fetchMock.mock.calls.at(-1)![0] as string;
}

/** The RequestInit (with parsed JSON body) of the most recent everhourFetch call. */
function lastInit(): { method?: string; body?: unknown } {
  const init = (fetchMock.mock.calls.at(-1)![1] ?? {}) as { method?: string; body?: string };
  return {
    method: init.method,
    body: init.body ? JSON.parse(init.body) : undefined,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
});

describe('registration', () => {
  it('registers all 30 tools', () => {
    expect(tools.size).toBe(30);
  });

  it('marks every tool as touching the open world (external API)', () => {
    for (const tool of tools.values()) {
      expect(tool.annotations?.openWorldHint, tool.name).toBe(true);
    }
  });

  it('flags the four destructive tools and nothing else', () => {
    const destructive = [...tools.values()]
      .filter((t) => t.annotations?.destructiveHint === true)
      .map((t) => t.name)
      .sort();
    expect(destructive).toEqual([
      'everhour_project_delete',
      'everhour_section_delete',
      'everhour_task_delete',
      'everhour_time_delete',
    ]);
  });

  it('marks read tools as read-only', () => {
    for (const name of [
      'everhour_me',
      'everhour_projects_list',
      'everhour_project_get',
      'everhour_tasks_search',
      'everhour_timer_current',
    ]) {
      expect(getTool(tools, name).annotations?.readOnlyHint, name).toBe(true);
    }
  });
});

describe('read tools build the right request', () => {
  it('encodes ids in the path', async () => {
    await callText('everhour_project_get', { project_id: 'ev:12345' });
    expect(lastPath()).toBe('/projects/ev%3A12345');
  });

  it('passes date ranges through as query params', async () => {
    await callText('everhour_user_time', { from: '2024-01-01', to: '2024-01-31' });
    expect(lastPath()).toBe('/users/me/time?from=2024-01-01&to=2024-01-31');
  });

  it('omits searchInClosed unless search_closed is true', async () => {
    await callText('everhour_tasks_search', { query: 'bug' });
    expect(lastPath()).toBe('/tasks/search?query=bug');

    await callText('everhour_tasks_search', { query: 'bug', search_closed: true, limit: 5 });
    expect(lastPath()).toBe('/tasks/search?query=bug&searchInClosed=true&limit=5');
  });

  it('returns the fetched payload as pretty JSON', async () => {
    fetchMock.mockResolvedValueOnce({ id: 1304, name: 'Ada' });
    const text = await callText('everhour_me', {});
    expect(JSON.parse(text)).toEqual({ id: 1304, name: 'Ada' });
  });
});

describe('write tools build the right body', () => {
  it('adds a time entry with only the provided fields', async () => {
    await callText('everhour_time_add', {
      time: 3600,
      date: '2024-01-20',
      task_id: 'ev:1',
      comment: 'work',
    });
    expect(lastPath()).toBe('/time');
    expect(lastInit()).toEqual({
      method: 'POST',
      body: { time: 3600, date: '2024-01-20', task: 'ev:1', comment: 'work' },
    });
  });

  it('creates a task under the given project', async () => {
    await callText('everhour_task_create', { project_id: 'ev:9', name: 'New task' });
    expect(lastPath()).toBe('/projects/ev%3A9/tasks');
    expect(lastInit()).toEqual({ method: 'POST', body: { name: 'New task' } });
  });

  it('updates only the fields that were passed', async () => {
    await callText('everhour_project_update', { project_id: 'ev:9', name: 'Renamed' });
    expect(lastPath()).toBe('/projects/ev%3A9');
    expect(lastInit()).toEqual({ method: 'PUT', body: { name: 'Renamed' } });
  });

  it('starts a timer for a task', async () => {
    await callText('everhour_timer_start', { task_id: 'ev:1', comment: 'go' });
    expect(lastPath()).toBe('/timers');
    expect(lastInit()).toEqual({ method: 'POST', body: { task: 'ev:1', comment: 'go' } });
  });
});

describe('destructive tools require confirm', () => {
  const cases: Array<{ name: string; args: Record<string, unknown>; path: string }> = [
    { name: 'everhour_project_delete', args: { project_id: 'ev:1' }, path: '/projects/ev%3A1' },
    { name: 'everhour_section_delete', args: { section_id: '55' }, path: '/sections/55' },
    { name: 'everhour_task_delete', args: { task_id: 'ev:2' }, path: '/tasks/ev%3A2' },
    { name: 'everhour_time_delete', args: { time_id: 42 }, path: '/time/42' },
  ];

  for (const { name, args, path } of cases) {
    it(`${name} does not delete without confirm`, async () => {
      const text = await callText(name, args);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(text).toContain('confirm: true');
      expect(text).toMatch(/permanently delete/i);
    });

    it(`${name} deletes when confirm is true`, async () => {
      await callText(name, { ...args, confirm: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(lastPath()).toBe(path);
      expect(lastInit().method).toBe('DELETE');
    });

    it(`${name} exposes a confirm parameter in its schema`, () => {
      expect('confirm' in (getTool(tools, name).schema ?? {})).toBe(true);
    });
  }
});
