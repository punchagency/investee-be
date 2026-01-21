# Investee Server Backend

## Project Overview

Investee Server is a TypeScript-based backend for a property investment platform. It uses Express.js for the REST API and TypeORM with PostgreSQL for data persistence. The system features advanced capabilities including AI-powered searches, property enrichment (RentCast/Attom/Google Maps), and vector similarity search for document retrieval.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Spatial/Vector**: PostGIS, pgvector
- **Authentication**: JWT (Access + Refresh Tokens in HTTP-only cookies), bcryptjs
- **Validation**: Zod
- **Logging**: Pino, Morgan
- **AI/ML**: OpenAI, MaxMind GeoIP
- **Testing**: (Not explicitly seen, but typical jest/supertest implied by structure)

## Architecture

The project follows a **Layered Architecture** with a specialized **Storage Pattern** for data access.

### Directory Structure

- `src/index.ts`: Application entry point and server initialization.
- `src/db.ts`: Database connection, initialization, and extension management (PostGIS, pgvector).
- `src/routes/`: API route definitions.
- `src/controllers/`: Request handling logic.
- `src/entities/`: TypeORM entity definitions (Database Schema).
- `src/storage/`: Data Access Layer (Repository Pattern wrappers). Handles DB interactions.
- `src/services/`: External integrations (Attom, RentCast, OpenAI) and complex business logic.
- `src/middleware/`: Express middleware (Auth, Logging).
- `src/utils/`: Shared utilities (Logger, AI Tools).
- `src/migrations/`: Database migrations.

### Core Design Pattern

1.  **Request Flow**: `Route` -> `Controller` -> `Storage` (for DB) OR `Service` (for External APIs).
2.  **Storage Layer**: Instead of accessing Repositories directly in Controllers, a `Storage` class (e.g., `PropertyStorage`) encapsulates TypeORM logic, providing a clean API for data access.
3.  **Service Layer**: Primarily used for external API integrations (RentCast, Attom, Google Maps) and AI operations (RAG, Fine-tuning).

## Development Commands

| Command | Description |
| str | str |
| :--- | :--- |
| `npm run dev` | Start development server with hot-reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to JavaScript (`tsc`) |
| `npm start` | Run the compiled production server |
| `npm run check` | Run type checking |
| `npm run seed` | active `import-properties.ts` script |
| `npm run ingest` | Run document ingestion for RAG (with memory boost) |
| `npm run train:fine-tune` | Run AI fine-tuning script |

## Key Patterns

- **Adding a New Feature**:
  1.  Define Entity in `src/entities/`.
  2.  Create `src/storage/[Feature].storage.ts` to wrap the repository.
  3.  Create `src/controllers/[Feature].controller.ts`.
  4.  Define routes in `src/routes/[Feature].routes.ts`.
  5.  Register routes in `src/index.ts`.
- **Database Management**:
  - `AppDataSource` in `src/db.ts` configures the connection.
  - `synchronize` is set to `false` by default, but manually triggered in `initializeDatabase` for non-production envs.
  - PostGIS and Vector extensions are initialized safely on startup.
- **Environment Variables**:
  - Managed via `.env` file (loaded by `dotenv`).
  - Key vars: `DATABASE_URL`, `PORT`, `NODE_ENV`, `OPENAI_API_KEY`, `ATTOM_API_KEY`, `RENTCAST_API_KEY`.
