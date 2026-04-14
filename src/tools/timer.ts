import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';

interface Timer {
  status: string;
  duration: number;
  today: number;
  startedAt?: string;
  task?: { id: string; name: string };
  user?: { id: number; name: string };
}

export function registerTimerTools(server: McpServer): void {
  server.tool(
    'everhour_timer_current',
    'Get the currently running timer (if any)',
    {},
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
    },
    async ({ task_id, comment }) => {
      const body: Record<string, unknown> = { task: task_id };
      if (comment) body.comment = comment;
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
