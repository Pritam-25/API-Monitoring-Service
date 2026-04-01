# Express API Server

Lightweight Express backend scaffold used for the Learn GraphQL project. This README shows how to get started, run the app, and where to find the main parts of the codebase.

## Quick Start

Prerequisites:

- Node.js 18+ (recommended)
- pnpm (or npm/yarn)

Install dependencies and start in development mode:

```bash
pnpm install
pnpm dev
```

Copy environment variables from `.env.example` before running in any environment.

## Available Scripts

- `pnpm dev` — Run the server in development with hot-reload.
- `pnpm start` — Run the production build.
- `pnpm build` — Build TypeScript for production.
- `pnpm lint` — Run linters (if configured).

## Environment

Create a `.env` from `.env.example` and set the required variables. Typical variables include `PORT`, `NODE_ENV`, `DATABASE_URL`, and any third-party keys required by services the app uses.

## Project Structure

Top-level layout and purpose of important files and folders:

- [src/app.ts](src/app.ts) — Express application setup (middleware, routes, error handling).
- [src/index.ts](src/index.ts) — Server bootstrap (starts the HTTP server).
- [src/controllers](src/controllers) — Route handlers and controller logic. See [src/controllers/index.ts](src/controllers/index.ts).
- [src/routes](src/routes) — Route definitions and mounting. See [src/routes/index.ts](src/routes/index.ts).
- [src/middleware](src/middleware) — Express middleware (validation, error handling). See [src/middleware/error.middleware.ts](src/middleware/error.middleware.ts) and [src/middleware/validate.middleware.ts](src/middleware/validate.middleware.ts).
- [src/services](src/services) — Business logic and service layer. See [src/services/index.ts](src/services/index.ts).
- [src/repositories](src/repositories) — Data access layer and DB queries. See [src/repositories/index.ts](src/repositories/index.ts).
- [src/models](src/models) — Data models or TypeScript types used across the app. See [src/models/index.ts](src/models/index.ts).
- [src/lib](src/lib) — Small utilities and integrations. See [src/lib/index.ts](src/lib/index.ts).
- [src/utils](src/utils) — Generic helpers like `apiError`, `apiResponse`, and `asyncHandler`.

Files worth checking for app conventions and helpers:

- [src/utils/apiError.ts](src/utils/apiError.ts)
- [src/utils/apiResponse.ts](src/utils/apiResponse.ts)
- [src/utils/asyncHandler.ts](src/utils/asyncHandler.ts)
- [src/utils/env.ts](src/utils/env.ts)

## Configuration & Secrets

- Use `.env` for local secrets. For production, provide environment variables via your deployment platform or Docker.
- If you use a database or external services (S3, auth providers), set the appropriate connection strings and API keys in the environment.

## Running with Docker

Build and run the container:

```bash
docker build -t learn-graphql-server .
docker run --env-file .env -p 4000:4000 learn-graphql-server
```

## Testing & Linting

Add test and lint scripts as needed. If you have tests, run them with `pnpm test`.

## Contributing

1. Fork the repo and create a feature branch.
2. Run `pnpm install` and make your changes.
3. Open a pull request with a clear description of the change.

## License

This project is provided as-is. Add your license file or notice here.
