import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { everhourFetch } from '../everhour-client.js';
import type { User } from '../types.js';

export function registerUserTools(server: McpServer): void {
  server.tool(
    'everhour_me',
    'Get my own Everhour profile (name, email, role, active workspace)',
    {},
    { title: 'Get my profile', readOnlyHint: true, openWorldHint: true },
    async () => {
      const me = await everhourFetch<User>('/users/me');
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(me, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'everhour_team_users',
    'List all team members (id, name, email, role, status)',
    {},
    { title: 'List team members', readOnlyHint: true, openWorldHint: true },
    async () => {
      const users = await everhourFetch<User[]>('/team/users');
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(users, null, 2),
          },
        ],
      };
    },
  );
}
