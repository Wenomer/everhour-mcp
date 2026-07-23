import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';
import type { Timer } from '../types.js';

export function registerTimerTools(server: McpServer): void {
  server.tool(
    'everhour_timer_current',
    'Get the currently running timer (if any)',
    {},
    { title: 'Get current timer', readOnlyHint: true, openWorldHint: true },
    async () => {
      const timer = await everhourFetch<Timer>('/timers/current');
      return {
        content: [
          {
            type: 'text' as const,
            text: timer ? JSON.stringify(timer, null, 2) : 'No active timer',
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_timer_start',
    'Start a timer for a specific task',
    {
      task_id: z.string().describe('Everhour task ID to start the timer for'),
      comment: z.string().optional().describe('Optional comment/notes for this time entry'),
      user_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Current user date (YYYY-MM-DD), used when user timezone differs from server'),
    },
    { title: 'Start timer', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    async ({ task_id, comment, user_date }) => {
      const body: Record<string, unknown> = { task: task_id };
      if (comment) body.comment = comment;
      if (user_date) body.userDate = user_date;
      const timer = await everhourFetch<Timer>('/timers', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(timer, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_timer_stop',
    'Stop the currently running timer',
    {},
    { title: 'Stop timer', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    async () => {
      const timer = await everhourFetch<Timer>('/timers/current', {
        method: 'DELETE',
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: timer
              ? JSON.stringify(timer, null, 2)
              : 'Timer stopped',
          },
        ],
      };
    },
  );
}
