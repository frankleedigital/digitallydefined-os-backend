# ❄️ FROZEN — read before changing anything

**Status: Frozen as of 2026-09-27.**

This project is **no longer the place to add new backend features.** New work
goes in [`digitallydefined-backend-clean/`](../digitallydefined-backend-clean/),
which is the active, deployed backend (`digitallydefined-backend-clean.vercel.app`).

## Still canonical — do NOT remove or relocate

- **Supabase edge functions** (`supabase/functions/`) remain the **canonical
  deploy location** for edge functions. Deploy them from this repo. Moving them
  caused overwrite conflicts in the past.
- The **FastAPI routers** under `fastapi/app/routers/` are still the only
  implementation of `affiliate`, `assetplan`, `blueprint`, `domain`,
  `offerarchitect`, `rankrent` and `wealth`. `niche`, `roadmap`, `product` and
  `trends` now exist in both places — the clean backend wins going forward.

## If you need to change something here

1. Open an issue/ticket first — confirm it cannot live in `backend-clean`.
2. Never commit `.env` or any secret. `.env.example` is the safe template.
3. Keep `deno.lock` current when touching edge functions.
4. Do not delete this repo: the Supabase functions still deploy from it.

## Historical note

See [DEPRECATED.md](DEPRECATED.md) for the original migration rationale.
