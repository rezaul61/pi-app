# PI

PI is a Next.js social intelligence network using PostgreSQL and Drizzle ORM.

## Production checklist

1. Copy `.env.example` to `.env.local` and configure `DATABASE_URL` and `APP_ORIGIN`.
2. Install dependencies with `npm install` and install the browser used by tests with `npx playwright install chromium`.
3. Provision the database from `src/db/schema.ts` using `npx drizzle-kit push` in a controlled deployment environment.
4. Run `npm run typecheck`, `npm run lint`, `npm run build`, then `npm run test:e2e` against a seeded non-production database.
5. Put uploads on private object storage (R2/S3/Supabase Storage) before using serverless hosting. Local uploads are intended for development only.
6. Replace the in-memory rate limiter with Redis or another shared store before scaling beyond one application instance.

Do not commit `.env*`, `public/uploads`, or production database credentials.
