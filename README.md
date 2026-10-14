# PADCOIN

An animated roast board for 53 launchpads. Built with Next.js, React and Turso SQLite for Vercel. Search, filters, bookmarks, sharing, community submissions and persistent votes are included.

## Deploy to Vercel

Open `START-HERE.html` for a visual guide. To deploy the extracted folder directly, install Node.js 22 and run `npx --yes vercel --prod`. Windows users can double-click `deploy.cmd`; Mac/Linux users can run `bash deploy.sh`. The repository upload and database setup steps are in the guide.

1. Deploy this directory as a Next.js project. Vercel uses `vercel.json` and the pinned pnpm lockfile.
2. Connect a free Turso Cloud database from Vercel Marketplace to the project. It provides `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for the selected environments. Keep both server-side.
3. Redeploy after adding storage. The schema initializes automatically on the first API request. No database credentials are required during the build.
4. Optionally set `NEXT_PUBLIC_SITE_URL` to a custom HTTPS origin for social sharing. Otherwise the project's Vercel production hostname is used.

Votes are unique per browser session and can be retracted. Anonymous submissions are limited to six per session per hour. Serverless filesystem storage is not used in production.

## Development and verification

Install dependencies with `pnpm install --frozen-lockfile`, configure the Turso variables in `.env.local`, then run `pnpm dev`.

Run `pnpm test` for roster, search, persistence, validation, vote idempotency and submission limit checks. Tests use a disposable local libSQL database. Run `pnpm typecheck` and `pnpm build` before deployment.

The Vercel deployment copy preserves the animated site at source commit `c3fd5c85efd48f195f4cdbacb482e598a68c6ba8`. Clank has one separate roster entry following the requested revert. Existing community data in the previous hosting database is not copied automatically; export it before importing into Turso if needed.
