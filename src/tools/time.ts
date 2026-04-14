import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';

interface TimeEntry {
  id: number;
  task: { id: string; name: string };
  user: number;
  date: string;
  time: number;
  history?: unknown[];
}

export function registerTimeTools(server: McpServer): void {
  server.tool(
    'everhour_time_add',
    'Add a time entry to a task (time in seconds, date as YYYY-MM-DD)',
    {
      task_id: z.string().describe('Everhour task ID (e.g. "ev:12345" or integration-specific)'),
      time: z.number().int().positive().describe('Time spent in seconds'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date in YYYY-MM-DD format'),
    },
    async ({ task_id, time, date }) => {
      const entry = await everhourFetch<TimeEntry>(
        `/tasks/${encodeURIComponent(task_id)}/time`,
        {
          method: 'POST',
          body: JSON.stringify({ time, date }),
        },
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(entry, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_time_update',
    'Update an existing time entry for a task on a specific date',
    {
      task_id: z.string().describe('Everhour task ID'),
      time: z.number().int().positive().describe('New time value in seconds'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date of the entry to update (YYYY-MM-DD)'),
    },
    async ({ task_id, time, date }) => {
      const entry = await everhourFetch<TimeEntry>(
        `/tasks/${encodeURIComponent(task_id)}/time`,
        {
          method: 'PUT',
          body: JSON.stringify({ time, date }),
        },
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(entry, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_time_delete',
    'Delete a time entry for a task on a specific date',
    {
      task_id: z.string().describe('Everhour task ID'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date of the entry to delete (YYYY-MM-DD)'),
    },
    async ({ task_id, date }) => {
      await everhourFetch(
        `/tasks/${encodeURIComponent(task_id)}/time`,
        {
          method: 'DELETE',
          body: JSON.stringify({ date }),
        },
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: `Time entry deleted for task ${task_id} on ${date}`,
          },
        ],
      };
    },
  );
}
