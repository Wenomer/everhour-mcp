import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTimerTools } from './tools/timer.js';
import { registerTimeTools } from './tools/time.js';
import { registerReportTools } from './tools/reports.js';
import { registerNavigationTools } from './tools/navigation.js';
import { registerUserTools } from './tools/users.js';
import { registerManageTools } from './tools/manage.js';

const server = new McpServer({
  name: 'everhour',
  version: '1.0.0',
});

registerTimerTools(server);
registerTimeTools(server);
registerReportTools(server);
registerNavigationTools(server);
registerUserTools(server);
registerManageTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
