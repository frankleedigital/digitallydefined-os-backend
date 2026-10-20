# 📦 ARCHIVED — 2026-09-27

**Do not develop here.** This project is superseded by
[`digitallydefined-online-local`](../../digitallydefined-online-local), the single
production website for DigitallyDefined (`https://digitallydefined.online`).

## Why it was archived

- It was **never deployed** — `digitallydefined-website-clean.vercel.app` returns 404.
- It had **no git repository**, so none of this work was version-controlled.
- It duplicated the quiz already maintained in `online-local`, with a second
  copy of the homepage and its own Tailwind theme.
- Its build was broken for most of its life (`Home.jsx` imported five components
  that did not exist).

## What was salvaged

The only behaviour not present in `online-local` was an **email gate before the
result**. That has been ported and improved:

- Ported to `online-local/src/features/quiz/components/QuizEmailCapture.jsx`
- Copy rewritten to the DigitallyDefined voice (this project's copy was generic
  marketing: "No hustle culture, no neon energy")
- `text-red-400` replaced with the brand danger red
- **Critical fix:** in this project the quiz `await`ed the submit API *before*
  navigating, so a failed or slow network call left the user on a blank page.
  The ported version builds, persists and renders the result *first*, and treats
  email delivery as strictly best-effort. That bug is the likely cause of the
  reported "quiz page is blank" issue.

## Note

`.env` was deleted during archiving because it contained live keys in an
untracked directory. `.env.example` is retained. Nothing else was removed —
this is a move, not a deletion.
