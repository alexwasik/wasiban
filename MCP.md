# Wasiban MCP Server

This project includes a Model Context Protocol (MCP) server that provides direct access to the Kanban board's underlying database. It allows AI assistants and other MCP-compatible clients to inspect and manage boards, columns, cards, and comments via server tools and resources, bypassing the HTTP API layer for fast, native execution.

## Connecting via Claude CLI

There are two ways to connect — **local** (reads source files directly, uses local `dev.db`) or **Docker** (uses the built image and its persistent volume).

### Option 1 — Local (recommended for development)

Runs directly from source. Always reflects the latest code changes without requiring a Docker rebuild.

```bash
claude mcp add --transport stdio --scope user wasiban-local \
  -- /path/to/wasiban/scripts/mcp.sh
```

Replace `/path/to/wasiban` with the absolute path to your cloned repo (e.g. `/Users/yourname/repos/wasiban`).

> **Note:** A wrapper script ([scripts/mcp.sh](scripts/mcp.sh)) is used instead of a direct `npx tsx` call because Claude CLI spawns MCP processes from its own working directory. The script `cd`s to the repo root first so the database path resolves correctly.

### Option 2 — Docker

Runs inside Docker using the `wasiban-data` volume. Requires rebuilding the image after code changes.

```bash
claude mcp add --transport stdio --scope user wasiban-docker -- docker run -i -v wasiban-data:/app/data wasiban node ./node_modules/.bin/tsx src/mcp/server.ts
```

> **Note:** If you have made code changes since the last Docker build, run `docker build -t wasiban .` first so the container includes the latest server code.

## Running Manually

You can also start the MCP server directly (useful for testing):

```bash
npm run mcp
```

## Resources

The server exposes read-only data as **Resources**, which provide contextual state about the Kanban boards without modifying them.

| Resource URI    | Description                                                                                     | Mime Type          |
| :-------------- | :---------------------------------------------------------------------------------------------- | :----------------- |
| `boards://list` | Returns an overview of all boards in the database.                                              | `application/json` |
| `board://{id}`  | Returns deep context for a specific board, including its structural columns, cards, and labels. | `application/json` |

## Tools

The server exposes mutations and actions as **Tools**, allowing the client to manipulate the Kanban board data directly.

### Board Management

- **`list_boards`**: List all Kanban boards.
- **`get_board`**: Get a board by ID including all its columns and cards.
  - _Inputs_: `id` (string, required).
- **`create_board`**: Create a new Kanban board.
  - _Inputs_: `name` (string, required), `description` (string), `color` (string).
- **`update_board`**: Update an existing Kanban board's properties.
  - _Inputs_: `id` (string, required), `name` (string), `description` (string), `color` (string).
- **`delete_board`**: Delete an existing Kanban board.
  - _Inputs_: `id` (string, required).

### Column Management

- **`create_column`**: Create a new column in a board.
  - _Inputs_: `boardId` (string, required), `name` (string, required), `position` (number, required).

### Card Management

- **`create_card`**: Create a new card in a specified column.
  - _Inputs_: `columnId` (string, required), `title` (string, required), `description` (string), `position` (number, required), `priority` (`low` | `medium` | `high` | `highest`).
- **`update_card`**: Update an existing card's properties.
  - _Inputs_: `id` (string, required), `title` (string), `description` (string), `statusUpdate` (string), `dueDate` (ISO 8601 string), `priority` (`low` | `medium` | `high` | `highest`).
- **`move_card`**: Move an existing card to a different column or position.
  - _Inputs_: `cardId` (string, required), `newColumnId` (string, required), `newPosition` (number, required).
- **`filter_cards_by_priority`**: Filter cards by priority, optionally scoped to a board or column.
  - _Inputs_: `priority` (`low` | `medium` | `high` | `highest`), `boardId` (string), `columnId` (string).

### Label Management

- **`get_board_labels`**: Get all labels defined for a board.
  - _Inputs_: `boardId` (string, required).
- **`create_label`**: Create a new label on a board.
  - _Inputs_: `boardId` (string, required), `name` (string, required), `color` (hex string, required, e.g. `#ff4d4f`).
- **`delete_label`**: Delete a label from a board.
  - _Inputs_: `id` (string, required).
- **`add_label_to_card`**: Apply a label to a card.
  - _Inputs_: `cardId` (string, required), `labelId` (string, required).
- **`remove_label_from_card`**: Remove a label from a card.
  - _Inputs_: `cardId` (string, required), `labelId` (string, required).

### Comment Management

- **`get_comments`**: Get all comments for a card.
  - _Inputs_: `cardId` (string, required).
- **`create_comment`**: Add a comment to a card (supports Markdown).
  - _Inputs_: `cardId` (string, required), `content` (string, required).
- **`delete_comment`**: Delete a comment by ID.
  - _Inputs_: `id` (string, required).

---

_Powered by the official [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)._
