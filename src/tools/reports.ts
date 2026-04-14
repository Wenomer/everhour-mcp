import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function registerReportTools(server: McpServer): void {
  server.tool(
    'everhour_team_time',
    'Export team time entries for a date range (optionally filtered by user or project)',
    {
      from: z.string().regex(datePattern).describe('Start date (YYYY-MM-DD)'),
      to: z.string().regex(datePattern).describe('End date (YYYY-MM-DD)'),
      user_id: z.number().int().optional().describe('Filter by user ID'),
      project_id: z.string().optional().describe('Filter by project ID'),
    },
    async ({ from, to, user_id, project_id }) => {
      const params = new URLSearchParams({ from, to });
      if (user_id !== undefined) params.set('user', String(user_id));
      if (project_id !== undefined) params.set('project', project_id);

      const entries = await everhourFetch<unknown[]>(
        `/team/time?${params.toString()}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(entries, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_user_time',
    'Get my own time entries for a date range',
    {
      from: z.string().regex(datePattern).describe('Start date (YYYY-MM-DD)'),
      to: z.string().regex(datePattern).describe('End date (YYYY-MM-DD)'),
    },
    async ({ from, to }) => {
      const params = new URLSearchParams({ from, to });
      const entries = await everhourFetch<unknown[]>(
        `/users/me/time?${params.toString()}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(entries, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_projects_list',
    'List all projects (useful to discover project and task IDs). Supports filtering by name and platform.',
    {
      query: z.string().optional().describe('Search projects by name'),
      limit: z.number().int().positive().optional().describe('Max results'),
      platform: z.enum(['as', 'ev', 'b3', 'b2', 'pv', 'gh', 'in', 'tr', 'jr']).optional().describe('Filter by integration platform'),
    },
    async ({ query, limit, platform }) => {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (limit !== undefined) params.set('limit', String(limit));
      if (platform) params.set('platform', platform);
      const qs = params.toString();
      const projects = await everhourFetch<unknown[]>(`/projects${qs ? `?${qs}` : ''}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    },
  );
}
