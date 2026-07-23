import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch, buildQuery } from '../everhour-client.js';
import type { Project, Section, Task } from '../types.js';

export function registerNavigationTools(server: McpServer): void {
  server.tool(
    'everhour_project_get',
    'Get a specific project by ID (includes sections and task counts)',
    {
      project_id: z.string().describe('Project ID (e.g. "ev:12345678")'),
    },
    { title: 'Get project', readOnlyHint: true, openWorldHint: true },
    async ({ project_id }) => {
      const project = await everhourFetch<Project>(
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
    { title: 'List sections', readOnlyHint: true, openWorldHint: true },
    async ({ project_id }) => {
      const sections = await everhourFetch<Section[]>(
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
    { title: 'Get section', readOnlyHint: true, openWorldHint: true },
    async ({ section_id }) => {
      const section = await everhourFetch<Section>(
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
    { title: 'List tasks', readOnlyHint: true, openWorldHint: true },
    async ({ project_id, section_id, page, limit }) => {
      const path = `/projects/${encodeURIComponent(project_id)}/tasks${buildQuery({ section: section_id, page, limit })}`;
      const tasks = await everhourFetch<Task[]>(path);
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
    { title: 'Get task', readOnlyHint: true, openWorldHint: true },
    async ({ task_id }) => {
      const task = await everhourFetch<Task>(
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
    { title: 'Search tasks', readOnlyHint: true, openWorldHint: true },
    async ({ query, search_closed, limit }) => {
      const tasks = await everhourFetch<Task[]>(
        `/tasks/search${buildQuery({ query, searchInClosed: search_closed || undefined, limit })}`,
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
    { title: 'Search project tasks', readOnlyHint: true, openWorldHint: true },
    async ({ project_id, query, search_closed, limit }) => {
      const tasks = await everhourFetch<Task[]>(
        `/projects/${encodeURIComponent(project_id)}/tasks/search${buildQuery({ query, searchInClosed: search_closed || undefined, limit })}`,
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
