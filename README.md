# LLM Lab

A monorepo project with a React frontend (client) and ElysiaJS backend (server).

## Project Structure

```
.
├── packages/
│   ├── client/     # React + Vite frontend application
│   └── server/     # ElysiaJS backend API server
└── package.json     # Root workspace configuration
```

## Getting Started

### Install Dependencies

```bash
bun install
```

### Run Client (Frontend)

```bash
cd packages/client
bun run dev
```

### Run Server (Backend)

```bash
cd packages/server
bun run dev
```

The server will start at `http://localhost:3000`

## Workspaces

This project uses Bun workspaces to manage multiple packages in a monorepo structure.

