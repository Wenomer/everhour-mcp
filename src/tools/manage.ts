import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { everhourFetch } from '../everhour-client.js';

export function registerManageTools(server: McpServer): void {
  // ── Projects ──────────────────────────────────────────────

  server.tool(
    'everhour_project_create',
    'Create a new Everhour project',
    {
      name: z.string().describe('Project name'),
      type: z.enum(['board', 'list']).optional().describe('Project type (default "board")'),
      users: z.array(z.number().int()).optional().describe('User IDs to assign to the project'),
    },
    async ({ name, type, users }) => {
      const body: Record<string, unknown> = { name };
      if (type) body.type = type;
      if (users) body.users = users;

      const project = await everhourFetch<unknown>('/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(project, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_project_update',
    'Update an existing project (name, type, users)',
    {
      project_id: z.string().describe('Project ID'),
      name: z.string().optional().describe('New project name'),
      type: z.enum(['board', 'list']).optional().describe('Project type'),
      users: z.array(z.number().int()).optional().describe('User IDs to assign'),
    },
    async ({ project_id, name, type, users }) => {
      const body: Record<string, unknown> = {};
      if (name !== undefined) body.name = name;
      if (type !== undefined) body.type = type;
      if (users !== undefined) body.users = users;

      const project = await everhourFetch<unknown>(
        `/projects/${encodeURIComponent(project_id)}`,
        { method: 'PUT', body: JSON.stringify(body) },
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(project, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_project_delete',
    'Delete a project (irreversible)',
    {
      project_id: z.string().describe('Project ID to delete'),
    },
    async ({ project_id }) => {
      await everhourFetch(
        `/projects/${encodeURIComponent(project_id)}`,
        { method: 'DELETE' },
      );
      return {
        content: [{ type: 'text' as const, text: `Project ${project_id} deleted` }],
      };
    },
  );

  // ── Sections ──────────────────────────────────────────────

  server.tool(
    'everhour_section_create',
    'Create a new section within a project',
    {
      project_id: z.string().describe('Project ID'),
      name: z.string().describe('Section name'),
      status: z.enum(['open', 'closed']).optional().describe('Section status (default "open")'),
      position: z.number().int().optional().describe('Position index in the project'),
    },
    async ({ project_id, name, status, position }) => {
      const body: Record<string, unknown> = { name };
      if (status) body.status = status;
      if (position !== undefined) body.position = position;

      const section = await everhourFetch<unknown>(
        `/projects/${encodeURIComponent(project_id)}/sections`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(section, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_section_update',
    'Update a section (name, status, position)',
    {
      project_id: z.string().describe('Project ID'),
      section_id: z.string().describe('Section ID'),
      name: z.string().optional().describe('New section name'),
      status: z.enum(['open', 'closed']).optional().describe('Section status'),
      position: z.number().int().optional().describe('New position index'),
    },
    async ({ project_id, section_id, name, status, position }) => {
      const body: Record<string, unknown> = {};
      if (name !== undefined) body.name = name;
      if (status !== undefined) body.status = status;
      if (position !== undefined) body.position = position;

      const section = await everhourFetch<unknown>(
        `/projects/${encodeURIComponent(project_id)}/sections/${encodeURIComponent(section_id)}`,
        { method: 'PUT', body: JSON.stringify(body) },
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(section, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_section_delete',
    'Delete a section from a project (irreversible)',
    {
      project_id: z.string().describe('Project ID'),
      section_id: z.string().describe('Section ID to delete'),
    },
    async ({ project_id, section_id }) => {
      await everhourFetch(
        `/projects/${encodeURIComponent(project_id)}/sections/${encodeURIComponent(section_id)}`,
        { method: 'DELETE' },
      );
      return {
        content: [{ type: 'text' as const, text: `Section ${section_id} deleted from project ${project_id}` }],
      };
    },
  );

  // ── Tasks ─────────────────────────────────────────────────

  server.tool(
    'everhour_task_create',
    'Create a new task in a project',
    {
      project_id: z.string().describe('Project ID'),
      name: z.string().describe('Task name'),
      section_id: z.string().optional().describe('Section ID to place the task in'),
      status: z.enum(['open', 'closed']).optional().describe('Task status (default "open")'),
      labels: z.array(z.string()).optional().describe('Labels/tags for the task'),
      description: z.string().optional().describe('Task description'),
      due_on: z.string().optional().describe('Due date (YYYY-MM-DD)'),
    },
    async ({ project_id, name, section_id, status, labels, description, due_on }) => {
      const body: Record<string, unknown> = { name };
      if (section_id) body.section = section_id;
      if (status) body.status = status;
      if (labels) body.labels = labels;
      if (description) body.description = description;
      if (due_on) body.dueOn = due_on;

      const task = await everhourFetch<unknown>(
        `/projects/${encodeURIComponent(project_id)}/tasks`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_task_update',
    'Update an existing task (name, status, labels, description, due date)',
    {
      task_id: z.string().describe('Task ID'),
      name: z.string().optional().describe('New task name'),
      section_id: z.string().optional().describe('Move task to this section'),
      status: z.enum(['open', 'closed']).optional().describe('Task status'),
      labels: z.array(z.string()).optional().describe('Labels/tags'),
      description: z.string().optional().describe('Task description'),
      due_on: z.string().optional().describe('Due date (YYYY-MM-DD)'),
    },
    async ({ task_id, name, section_id, status, labels, description, due_on }) => {
      const body: Record<string, unknown> = {};
      if (name !== undefined) body.name = name;
      if (section_id !== undefined) body.section = section_id;
      if (status !== undefined) body.status = status;
      if (labels !== undefined) body.labels = labels;
      if (description !== undefined) body.description = description;
      if (due_on !== undefined) body.dueOn = due_on;

      const task = await everhourFetch<unknown>(
        `/tasks/${encodeURIComponent(task_id)}`,
        { method: 'PUT', body: JSON.stringify(body) },
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }],
      };
    },
  );

  server.tool(
    'everhour_task_delete',
    'Delete a task (irreversible)',
    {
      task_id: z.string().describe('Task ID to delete'),
    },
    async ({ task_id }) => {
      await everhourFetch(
        `/tasks/${encodeURIComponent(task_id)}`,
        { method: 'DELETE' },
      );
      return {
        content: [{ type: 'text' as const, text: `Task ${task_id} deleted` }],
      };
    },
  );
}
