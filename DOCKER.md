# Running Wasiban with Docker

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine

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

## Quick Start

### 1. Build the image

```bash
docker build -t wasiban .
```

### 2. Run the container

```bash
docker run -p 3003:3003 -v wasiban-data:/app/data wasiban
```

The app will be available at **http://localhost:3003**.

### 3. Stop the container

Press `Ctrl+C`, or from another terminal:

```bash
docker stop $(docker ps -q --filter ancestor=wasiban)
```

## Data Persistence

The `-v wasiban-data:/app/data` flag mounts a Docker volume so your SQLite database persists across container restarts and rebuilds.

To start fresh (delete all data):

```bash
docker volume rm wasiban-data
```

## Running in the Background

```bash
docker run -d -p 3003:3003 -v wasiban-data:/app/data --name wasiban wasiban
```

Then manage with:

```bash
docker stop wasiban
docker start wasiban
docker logs wasiban
```

## Custom Port

To run on a different port (e.g., 8080):

```bash
docker run -p 8080:3003 -v wasiban-data:/app/data wasiban
```

Then visit **http://localhost:8080**.

## Model Context Protocol (MCP) Server

Wasiban includes an MCP server that allows AI agents (like Claude) to connect and interact directly with your Kanban board database. See [MCP.md](MCP.md) for full documentation including all available tools.

There are two ways to run the MCP server: **Docker** (recommended when using a persistent Docker volume) or **local** (recommended during development).

### Option 1 — Docker MCP

Uses the same `wasiban-data` volume as your running container, so the AI agent sees live production data. Requires rebuilding the image after code changes.

```bash
claude mcp add --transport stdio --scope user wasiban-docker \
  -- docker run -i -v wasiban-data:/app/data wasiban node ./node_modules/.bin/tsx src/mcp/server.ts
```

> If you have made code changes since the last build, run `docker build -t wasiban .` first.

### Option 2 — Local MCP

Runs directly from source against your local `dev.db`. Always reflects the latest code without a Docker rebuild.

```bash
claude mcp add --transport stdio --scope user wasiban-local \
  -- /path/to/wasiban/scripts/mcp.sh
```

Replace `/path/to/wasiban` with the absolute path to your cloned repo.
