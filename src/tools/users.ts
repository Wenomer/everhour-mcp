import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { everhourFetch } from '../everhour-client.js';

export function registerUserTools(server: McpServer): void {
  server.tool(
    'everhour_me',
    'Get my own Everhour profile (name, email, role, active workspace)',
    {},
    async () => {
      const me = await everhourFetch<unknown>('/users/me');
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
    async () => {
      const users = await everhourFetch<unknown[]>('/team/users');
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
