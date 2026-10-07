# PI deployment and verification runbook

Use a staging deployment first. It must use a separate PostgreSQL database from production.

## 1. Prepare locally

```powershell
Copy-Item .env.example .env.local
# Edit .env.local: set DATABASE_URL and APP_ORIGIN
npm install
npx playwright install chromium
node --env-file=.env.local scripts/preflight.mjs
npx drizzle-kit push
npm run typecheck
npm run lint
npm run build
```

Do not continue until each command succeeds.

## 2. Seed and test staging

Create sample users and content only in staging:

```powershell
node --env-file=.env.local scripts/seed.mjs
npm run dev
# In another terminal:
npm run test:e2e
```

Manually test these flows too: register, login/logout, onboarding, profile image upload, six-item media posts, image/video/audio/file messages, location sharing, blocking, session removal, and Zones membership.

## 3. Deploy

1. Push this folder to a private Git repository.
2. Create a managed PostgreSQL database (Supabase, Neon, or Vercel Postgres).
3. In the hosting provider, set `DATABASE_URL` and `APP_ORIGIN` to the exact public HTTPS address.
4. Run `npx drizzle-kit push` once against the target database, through a protected CI/deployment job.
5. Deploy with the normal build command: `npm run build`.

For Vercel, local disk uploads will not persist. Switch `src/app/api/upload/route.ts` to private R2, S3, or Supabase Storage before production use.

## 4. Verify the deployed site

```powershell
node scripts/smoke-test.mjs https://your-domain.example
```

Then use two separate test accounts to verify messaging and Zone access. Do not test registration, uploads, or schema updates against production accounts until staging is clean.

## 5. Before accepting real users

- Replace the in-memory rate limiter with Redis.
- Connect LiveKit, Twilio, or Daily before enabling real audio/video call buttons.
- Configure object storage, backups, error monitoring, email verification, and a privacy policy.
- Use managed database backups and restrict database network access.
