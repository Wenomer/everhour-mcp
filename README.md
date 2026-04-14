# Everhour MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for the [Everhour](https://everhour.com) time tracking API. Gives AI assistants (Cursor, Claude, etc.) full access to your Everhour workspace — timers, time entries, projects, tasks, and team reports.

## Tools

### Users

| Tool | Description |
|------|-------------|
| `everhour_me` | Get your profile |
| `everhour_team_users` | List all team members |

### Timers

| Tool | Description |
|------|-------------|
| `everhour_timer_current` | Get running timer |
| `everhour_timer_start` | Start a timer for a task |
| `everhour_timer_stop` | Stop the running timer |

### Time Records

| Tool | Description |
|------|-------------|
| `everhour_time_add` | Add a time entry |
| `everhour_time_update` | Update a time record by ID |
| `everhour_time_delete` | Delete a time record by ID |
| `everhour_time_by_user` | Get time records for a specific user |
| `everhour_time_by_task` | Get time records for a specific task |
| `everhour_time_by_project` | Get time records for a specific project |
| `everhour_user_time` | Get your own time entries for a date range |
| `everhour_team_time` | Export team time (with user/project filters) |

### Projects

| Tool | Description |
|------|-------------|
| `everhour_projects_list` | List all projects |
| `everhour_project_get` | Get a project by ID |
| `everhour_project_create` | Create a project |
| `everhour_project_update` | Update a project |
| `everhour_project_delete` | Delete a project |

### Sections

| Tool | Description |
|------|-------------|
| `everhour_sections_list` | List sections in a project |
| `everhour_section_get` | Get a section by ID |
| `everhour_section_create` | Create a section in a project |
| `everhour_section_update` | Update a section |
| `everhour_section_delete` | Delete a section |

### Tasks

| Tool | Description |
|------|-------------|
| `everhour_tasks_list` | List tasks in a project |
| `everhour_task_get` | Get a task by ID |
| `everhour_tasks_search` | Search tasks by keyword across all projects |
| `everhour_project_tasks_search` | Search tasks by keyword within a specific project |
| `everhour_task_create` | Create a task |
| `everhour_task_update` | Update a task |
| `everhour_task_delete` | Delete a task |

## Setup

### 1. Get your Everhour API key

You can find your API key in your [Everhour profile](https://app.everhour.com/#/account/profile) at the bottom of the page. Alternatively, grab the `X-Api-Key` header value from the browser DevTools (Network tab) on any Everhour page.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure in Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Everhour": {
      "command": "npx",
      "args": ["tsx", "/path/to/everhour-mcp/src/index.ts"],
      "env": {
        "EVERHOUR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "everhour": {
      "command": "npx",
      "args": ["tsx", "/path/to/everhour-mcp/src/index.ts"],
      "env": {
        "EVERHOUR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Tech Stack

- TypeScript + [tsx](https://github.com/privatenumber/tsx)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod](https://zod.dev) for input validation
- [Everhour REST API](https://everhour.docs.apiary.io/)

## License

MIT
