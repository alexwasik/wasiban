# Wasiban

A kanban board app built with Next.js, Ant Design, and Prisma.

## Features

- Boards, columns, and cards with drag-and-drop reordering
- Card labels, due dates, priority levels, and markdown descriptions
- Status updates and threaded comments per card
- Search and priority filtering
- Dark mode support
- MCP server for AI agent integration

---

## Running Locally (npm + SQLite)

### Prerequisites

- Node.js v20.19+, v22.12+, v24.0+ (prisma requirement)
- npm

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Create a `.env` file in the project root:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Run migrations and generate Prisma client**

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Seed the database** _(optional — creates a sample board)_

   ```bash
   npm run db:seed
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3003](http://localhost:3003).

### Useful scripts

| Command                  | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `npm run dev`            | Start development server with hot reload (port 3003) |
| `npm run build`          | Build for production                                 |
| `npm run start`          | Start production server                              |
| `npm run prisma:migrate` | Create and apply a new migration                     |
| `npm run prisma:studio`  | Open Prisma Studio (database GUI)                    |
| `npm run db:reset`       | Reset and re-run all migrations                      |
| `npm run db:seed`        | Seed the database with sample data                   |

---

## Running with Docker (or Podman)

> **Note:** If you are behind a corporate proxy/firewall, you may need to handle TLS certificate validation. Two options are available:
>
> **Option A — Disable TLS verification (dev only, not for production)**
>
> Add the `--tls-verify=false` flag (Podman) or `--insecure` flag (Docker) to bypass registry TLS. You must also set `NODE_TLS_REJECT_UNAUTHORIZED=0` in the `build` stage of the Dockerfile so that Node.js (Prisma, npm) skips TLS verification when making network calls during the build:
>
> ```dockerfile
> # In the build stage, before the prisma commands:
> ENV NODE_TLS_REJECT_UNAUTHORIZED=0
> RUN npx prisma generate
> RUN npx prisma migrate deploy
> RUN npm run build
> ```
>
> **Option B — Trust your corporate CA certificate (recommended)**
>
> A more secure approach is to copy your corporate CA certificate file into the container and trust it in the build stage before any network calls:
>
> ```dockerfile
> # In the build stage, before the prisma commands:
> COPY corporate-ca.pem /usr/local/share/ca-certificates/corporate-ca.crt
> RUN update-ca-certificates
> RUN npx prisma generate
> RUN npx prisma migrate deploy
> RUN npm run build
> ```

> **Podman users:** Podman is CLI-compatible with Docker. Replace every `docker` command below (and in [DOCKER.md](DOCKER.md)) with `podman`. Everything else — flags, volume syntax, image names — stays the same. Named volumes are managed with `podman volume` instead of `docker volume`.

See [DOCKER.md](DOCKER.md) for full Docker instructions. Quick start:

1. **Build the image**

   ```bash
   docker build -t wasiban .
   ```

2. **Run the container**

   ```bash
   docker run -p 3003:3003 -v wasiban-data:/app/data wasiban
   ```

   The app will be available at [http://localhost:3003](http://localhost:3003).

   The container automatically runs migrations and seeds the database on first start. The `-v wasiban-data:/app/data` flag persists your SQLite database across restarts.

### Rebuilding after code changes

```bash
docker build -t wasiban . && docker run -p 3003:3003 -v wasiban-data:/app/data wasiban
```

---

## MCP Server

Wasiban exposes a [Model Context Protocol](https://modelcontextprotocol.io/) server so AI agents can read and manage boards programmatically. See [MCP.md](MCP.md) for full documentation.

### Running the server manually

```bash
npm run mcp
```

### Connecting via Claude CLI

There are two ways to connect — **local** (reads source files directly, uses local `dev.db`) or **Docker** (uses the built image and its persistent volume).

#### Option 1 — Local (recommended for development)

```bash
claude mcp add --transport stdio --scope user wasiban-local \
  -- /path/to/wasiban/scripts/mcp.sh
```

Replace `/path/to/wasiban` with the absolute path to your cloned repo.

#### Option 2 — Docker (or Podman)

```bash
claude mcp add --transport stdio --scope user wasiban-docker \
  -- docker run -i -v wasiban-data:/app/data wasiban node ./node_modules/.bin/tsx src/mcp/server.ts
```

Podman users replace `docker` with `podman`:

```bash
claude mcp add --transport stdio --scope user wasiban-docker \
  -- podman run -i -v wasiban-data:/app/data wasiban node ./node_modules/.bin/tsx src/mcp/server.ts
```

> If you have made code changes since the last build, run `docker build -t wasiban .` (or `podman build -t wasiban .`) first.

### Available tools

| Tool                       | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `list_boards`              | List all boards                                                          |
| `get_board`                | Get a board with all its columns and cards                               |
| `create_board`             | Create a new board                                                       |
| `update_board`             | Update a board's name, description, or color                             |
| `delete_board`             | Delete a board                                                           |
| `create_column`            | Add a column to a board                                                  |
| `create_card`              | Create a card in a column                                                |
| `update_card`              | Update a card's title, description, status update, due date, or priority |
| `move_card`                | Move a card to a different column or position                            |
| `filter_cards_by_priority` | Find cards matching a priority, optionally scoped to a board or column   |
| `get_board_labels`         | Get all labels defined for a board                                       |
| `create_label`             | Create a label on a board                                                |
| `delete_label`             | Delete a label                                                           |
| `add_label_to_card`        | Apply a label to a card                                                  |
| `remove_label_from_card`   | Remove a label from a card                                               |
| `get_comments`             | Get all comments for a card                                              |
| `create_comment`           | Add a comment to a card (supports Markdown)                              |
| `delete_comment`           | Delete a comment                                                         |

### Available resources

| Resource URI    | Description                                          |
| --------------- | ---------------------------------------------------- |
| `boards://list` | JSON list of all boards                              |
| `board://{id}`  | Full board data including columns, cards, and labels |

---

## Priority Levels

Cards support four priority levels displayed with custom icons on the kanban board:

| Priority | Icon                 | Color  |
| -------- | -------------------- | ------ |
| Low      | — (dash)             | Grey   |
| Medium   | › (single chevron)   | Green  |
| High     | ›› (double chevron)  | Orange |
| Highest  | ››› (triple chevron) | Red    |

Priority can be set in the card detail drawer and filtered from the board toolbar or via the API/MCP server.

You can also call the REST endpoint directly:

```
GET /api/cards?priority=high&boardId=<board-id>
GET /api/cards?priority=highest&columnId=<column-id>
```

---

## Environment Variables

| Variable       | Description                    | Default         |
| -------------- | ------------------------------ | --------------- |
| `DATABASE_URL` | SQLite file path or libsql URL | `file:./dev.db` |

---

## Tech Stack

- **Framework** — [Next.js](https://nextjs.org/)
- **UI** — [Ant Design](https://ant.design/)
- **Database** — SQLite via [libsql](https://github.com/tursodatabase/libsql)
- **ORM** — [Prisma](https://www.prisma.io/)
- **Drag & drop** — [dnd-kit](https://dndkit.com/)
- **MCP** — [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
