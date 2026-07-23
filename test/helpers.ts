import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTimerTools } from '../src/tools/timer.js';
import { registerTimeTools } from '../src/tools/time.js';
import { registerReportTools } from '../src/tools/reports.js';
import { registerNavigationTools } from '../src/tools/navigation.js';
import { registerUserTools } from '../src/tools/users.js';
import { registerManageTools } from '../src/tools/manage.js';

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
}

export interface CapturedTool {
  name: string;
  description?: string;
  schema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  handler: (args: Record<string, unknown>, extra?: unknown) => Promise<ToolResult>;
}

const ANNOTATION_KEYS = [
  'title',
  'readOnlyHint',
  'destructiveHint',
  'idempotentHint',
  'openWorldHint',
];

function looksLikeAnnotations(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    ANNOTATION_KEYS.some((k) => k in (value as Record<string, unknown>))
  );
}

/**
 * Run every `registerXTools` function against a stub server and collect the
 * tools they register, keyed by name. Handles the SDK's variadic
 * `tool(name, [description], schema, [annotations], cb)` overloads.
 */
export function registerAllTools(): Map<string, CapturedTool> {
  const tools = new Map<string, CapturedTool>();

  const server = {
    tool(...args: unknown[]) {
      const name = args[0] as string;
      const handler = args[args.length - 1] as CapturedTool['handler'];
      const middle = args.slice(1, -1);

      let description: string | undefined;
      let annotations: Record<string, unknown> | undefined;
      let schema: Record<string, unknown> | undefined;

      for (const part of middle) {
        if (typeof part === 'string') description = part;
        else if (looksLikeAnnotations(part)) annotations = part as Record<string, unknown>;
        else schema = part as Record<string, unknown>;
      }

      tools.set(name, { name, description, schema, annotations, handler });
    },
  } as unknown as McpServer;

  registerTimerTools(server);
  registerTimeTools(server);
  registerReportTools(server);
  registerNavigationTools(server);
  registerUserTools(server);
  registerManageTools(server);

  return tools;
}

/** Fetch a captured tool by name, failing loudly if it is missing. */
export function getTool(
  tools: Map<string, CapturedTool>,
  name: string,
): CapturedTool {
  const tool = tools.get(name);
  if (!tool) throw new Error(`Tool "${name}" was not registered`);
  return tool;
}
