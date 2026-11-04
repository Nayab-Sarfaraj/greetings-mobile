# Seasonal Cards

pnpm workspace for the web editor, Remotion compositions, shared types, and the Expo Android shell.

## Local development

1. Start Docker Desktop and run `docker compose up -d` for MongoDB.
2. Copy `.env.example` to `apps/web/.env.local`.
3. Run `pnpm install`, then `pnpm --filter @greetings/web dev`.
4. Visit `http://localhost:3000/api/health` to check the app and database.

Run `pnpm check` for typecheck, lint, tests, and formatting. The existing Expo app is in `apps/mobile`; run it with `pnpm --filter @greetings/mobile start`.
