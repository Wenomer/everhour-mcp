import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch, buildQuery } from '../everhour-client.js';
import type { Project, TimeEntry } from '../types.js';

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
    { title: 'Export team time', readOnlyHint: true, openWorldHint: true },
    async ({ from, to, user_id, project_id }) => {
      const entries = await everhourFetch<TimeEntry[]>(
        `/team/time${buildQuery({ from, to, user: user_id, project: project_id })}`,
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
    { title: 'My time entries', readOnlyHint: true, openWorldHint: true },
    async ({ from, to }) => {
      const entries = await everhourFetch<TimeEntry[]>(
        `/users/me/time${buildQuery({ from, to })}`,
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
      platform: z
        .enum(['as', 'ev', 'b3', 'b2', 'pv', 'gh', 'in', 'tr', 'jr'])
        .optional()
        .describe('Filter by integration platform'),
    },
    { title: 'List projects', readOnlyHint: true, openWorldHint: true },
    async ({ query, limit, platform }) => {
      const projects = await everhourFetch<Project[]>(
        `/projects${buildQuery({ query, limit, platform })}`,
      );
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
