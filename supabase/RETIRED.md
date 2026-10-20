# ⛔ RETIRED — Do Not Deploy From Here

This `supabase/` tree at the **workspace root** was consolidated on **2026-10-09**
into the canonical location:

**`digitallydefined-backend-clean/supabase/`**

Its 5 functions (`content`, `omniroute`, `quiz-roadmap`, `quiz-submit`,
`reputation`) and 4 `_shared` modules were moved there. This folder's CLI link
state (`.temp`) has been renamed `.temp.retired-20261009` so it **cannot deploy**
and overwrite production.

## Rules
- DO NOT run `supabase functions deploy` from this folder.
- DO NOT add new functions here — create them in `digitallydefined-backend-clean/supabase/functions/`.
- This tree is kept as historical reference only.
- Safe to delete once the canonical tree is confirmed deployed.

## Why
Three separate `supabase/` trees were all CLI-linked to the same project
(`dijjlppdljpcgyoakdnq`), which is exactly the "deploys overwrite each other"
failure documented in `docs/DEPLOYMENT_STATE.md`. There is now one linked tree.
