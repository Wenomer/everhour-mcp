import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';

interface TimeEntry {
  id: number;
  task: { id: string; name: string };
  user: number;
  date: string;
  time: number;
  comment?: string;
  history?: unknown[];
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function registerTimeTools(server: McpServer): void {
  server.tool(
    'everhour_time_by_user',
    'Get time records for a specific user within a date range',
    {
      user_id: z.number().int().describe('User ID'),
      from: z.string().regex(datePattern).optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().regex(datePattern).optional().describe('End date (YYYY-MM-DD)'),
      limit: z.number().int().positive().max(50000).optional().describe('Max results (default 10000, max 50000)'),
      page: z.number().int().positive().optional().describe('Page number'),
    },
    async ({ user_id, from, to, limit, page }) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (limit !== undefined) params.set('limit', String(limit));
      if (page !== undefined) params.set('page', String(page));
      const qs = params.toString();
      const entries = await everhourFetch<unknown[]>(
        `/users/${user_id}/time${qs ? `?${qs}` : ''}`,
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_time_by_task',
    'Get time records for a specific task within a date range',
    {
      task_id: z.string().describe('Task ID (e.g. "ev:12345678")'),
      from: z.string().regex(datePattern).optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().regex(datePattern).optional().describe('End date (YYYY-MM-DD)'),
      limit: z.number().int().positive().max(50000).optional().describe('Max results (default 10000, max 50000)'),
      page: z.number().int().positive().optional().describe('Page number'),
    },
    async ({ task_id, from, to, limit, page }) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (limit !== undefined) params.set('limit', String(limit));
      if (page !== undefined) params.set('page', String(page));
      const qs = params.toString();
      const entries = await everhourFetch<unknown[]>(
        `/tasks/${encodeURIComponent(task_id)}/time${qs ? `?${qs}` : ''}`,
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_time_by_project',
    'Get time records for a specific project within a date range',
    {
      project_id: z.string().describe('Project ID (e.g. "ev:12345678")'),
      from: z.string().regex(datePattern).optional().describe('Start date (YYYY-MM-DD)'),
      to: z.string().regex(datePattern).optional().describe('End date (YYYY-MM-DD)'),
      limit: z.number().int().positive().max(50000).optional().describe('Max results (default 10000, max 50000)'),
      page: z.number().int().positive().optional().describe('Page number'),
    },
    async ({ project_id, from, to, limit, page }) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (limit !== undefined) params.set('limit', String(limit));
      if (page !== undefined) params.set('page', String(page));
      const qs = params.toString();
      const entries = await everhourFetch<unknown[]>(
        `/projects/${encodeURIComponent(project_id)}/time${qs ? `?${qs}` : ''}`,
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_time_add',
    'Add a time entry (time in seconds, date as YYYY-MM-DD). Returns the created record with its id.',
    {
      time: z.number().int().positive().describe('Time spent in seconds'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date in YYYY-MM-DD format'),
      task_id: z.string().optional().describe('Everhour task ID (e.g. "ev:12345"). Optional — omit for taskless time.'),
      user_id: z.number().int().optional().describe('User ID (admin only, defaults to current user)'),
      comment: z.string().optional().describe('Optional comment/notes for this time entry'),
    },
    async ({ time, date, task_id, user_id, comment }) => {
      const body: Record<string, unknown> = { time, date };
      if (task_id) body.task = task_id;
      if (user_id !== undefined) body.user = user_id;
      if (comment) body.comment = comment;
      const entry = await everhourFetch<TimeEntry>('/time', {
        method: 'POST',
        body: JSON.stringify(body),
      });
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
    'Update an existing time record by its ID',
    {
      time_id: z.number().int().describe('Time record ID (returned from add/list operations)'),
      time: z.number().int().positive().optional().describe('New time value in seconds'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('New date (YYYY-MM-DD)'),
      task_id: z.string().optional().describe('Move record to a different task'),
      comment: z.string().optional().describe('Update comment'),
    },
    async ({ time_id, time, date, task_id, comment }) => {
      const body: Record<string, unknown> = {};
      if (time !== undefined) body.time = time;
      if (date !== undefined) body.date = date;
      if (task_id !== undefined) body.task = task_id;
      if (comment !== undefined) body.comment = comment;
      const entry = await everhourFetch<TimeEntry>(`/time/${time_id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
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
    'Delete a time record by its ID',
    {
      time_id: z.number().int().describe('Time record ID to delete'),
    },
    async ({ time_id }) => {
      const entry = await everhourFetch<TimeEntry>(`/time/${time_id}`, {
        method: 'DELETE',
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: entry
              ? JSON.stringify(entry, null, 2)
              : `Time record ${time_id} deleted`,
          },
        ],
      };
    },
  );
}
