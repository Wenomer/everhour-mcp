import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';

export function registerNavigationTools(server: McpServer): void {
  server.tool(
    'everhour_project_get',
    'Get a specific project by ID (includes sections and task counts)',
    {
      project_id: z.string().describe('Project ID (e.g. "ev:12345678")'),
    },
    async ({ project_id }) => {
      const project = await everhourFetch<unknown>(
        `/projects/${encodeURIComponent(project_id)}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_sections_list',
    'List sections (columns/groups) within a project',
    {
      project_id: z.string().describe('Project ID'),
    },
    async ({ project_id }) => {
      const sections = await everhourFetch<unknown[]>(
        `/projects/${encodeURIComponent(project_id)}/sections`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(sections, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_section_get',
    'Get a specific section by ID',
    {
      section_id: z.string().describe('Section ID'),
    },
    async ({ section_id }) => {
      const section = await everhourFetch<unknown>(
        `/sections/${encodeURIComponent(section_id)}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(section, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_tasks_list',
    'List tasks within a project (optionally filtered by section)',
    {
      project_id: z.string().describe('Project ID'),
      section_id: z.string().optional().describe('Filter by section ID'),
      page: z.number().int().positive().optional().describe('Page number (default 1)'),
      limit: z.number().int().positive().max(250).optional().describe('Results per page (default 250, max 250)'),
    },
    async ({ project_id, section_id, page, limit }) => {
      const params = new URLSearchParams();
      if (section_id !== undefined) params.set('section', section_id);
      if (page !== undefined) params.set('page', String(page));
      if (limit !== undefined) params.set('limit', String(limit));

      const qs = params.toString();
      const path = `/projects/${encodeURIComponent(project_id)}/tasks${qs ? `?${qs}` : ''}`;
      const tasks = await everhourFetch<unknown[]>(path);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_task_get',
    'Get a specific task by ID (includes time totals, estimates, assignees)',
    {
      task_id: z.string().describe('Task ID (e.g. "ev:12345678:90")'),
    },
    async ({ task_id }) => {
      const task = await everhourFetch<unknown>(
        `/tasks/${encodeURIComponent(task_id)}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_tasks_search',
    'Search tasks by keyword across all projects',
    {
      query: z.string().describe('Search keyword or phrase'),
      search_closed: z.boolean().optional().describe('Include closed tasks in results (default false)'),
      limit: z.number().int().positive().max(250).optional().describe('Max results (default 50)'),
    },
    async ({ query, search_closed, limit }) => {
      const params = new URLSearchParams({ query });
      if (search_closed) params.set('searchInClosed', 'true');
      if (limit !== undefined) params.set('limit', String(limit));

      const tasks = await everhourFetch<unknown[]>(
        `/tasks/search?${params.toString()}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_project_tasks_search',
    'Search tasks by keyword within a specific project',
    {
      project_id: z.string().describe('Project ID (e.g. "ev:12345678")'),
      query: z.string().describe('Search keyword or phrase'),
      search_closed: z.boolean().optional().describe('Include closed tasks in results (default false)'),
      limit: z.number().int().positive().max(250).optional().describe('Max results (default 50)'),
    },
    async ({ project_id, query, search_closed, limit }) => {
      const params = new URLSearchParams({ query });
      if (search_closed) params.set('searchInClosed', 'true');
      if (limit !== undefined) params.set('limit', String(limit));

      const tasks = await everhourFetch<unknown[]>(
        `/projects/${encodeURIComponent(project_id)}/tasks/search?${params.toString()}`,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    },
  );
}
