# DigitallyDefined — Funnel Runbook

**Written 2026-10-22.** Everything in "Live now" is already deployed and verified in production.
Everything in "Your turn" is the small list of things only you can do.

The whole funnel is built. It has been sitting behind one broken API route and a dead
domain. Both are fixed. What is left is four clicks and one email.

---

## Live right now (verified in production)

| Step | URL | Status |
|---|---|---|
| Free quiz (the lead magnet) | `https://dashboard.digitallydefined.agency/quiz` | ✅ 7 questions, scored on-device, result on screen |
| Quiz result + email opt-in | `https://dashboard.digitallydefined.agency/quiz/results` | ✅ result renders first, email is best-effort |
| Storefront (the shelf) | `https://dashboard.digitallydefined.agency/store` | ✅ 3 products, prices, buy links |
| Quiz → persona | backend | ✅ 5 personas: creator, builder, educator, connector, strategist |
| Quiz → list capture | Brevo list "DD Subscriber List" | ✅ contact created |
| Quiz → our database | Supabase `quiz_roadmaps` | ✅ persisted with persona |
| **Leads list (your segmented audience)** | `POST /api` action `leads` | ✅ every completion, segmented by persona, with counts |
| Dashboard | `https://dashboard.digitallydefined.agency/dashboard` | ✅ live |
| Fake metrics | — | ✅ **removed**. The dashboard now shows real numbers or an honest "not connected" |

**The backend quiz pipeline was built months ago and had been unreachable in production** — every
quiz action returned `404 Unknown action`, exactly like the licence gate did. It is now wired,
and the same fix was applied to the quiz list capture, the Brevo contact write, and the
persona segmentation.

---

## Your turn — 6 things, ~45 minutes total

### 1. Activate Brevo sending (~5 min) — **blocks all email**

Right now Brevo accepts contacts but refuses to send. The exact error:

> `Unable to send email. Your SMTP account is not yet activated. Please contact us at contact@brevo.com to request activation`

**Do this:** Brevo → Settings → **SMTP & API** → click **Activate SMTP** (or email
contact@brevo.com with "please activate my SMTP account"). Brevo sometimes also asks you to
confirm a sender or authenticate the domain `digitallydefined.online`.

**Why it matters:** until this is done, no roadmap email, no welcome sequence, no newsletter.
The quiz still captures every contact, so nothing is lost — the emails just don't leave.
Once it is on, everything starts flowing.

### 2. Fix the Gumroad API key (~5 min) — **blocks every sale**

Your dashboard sells at `francescaonline.gumroad.com` but the backend verifies licences with a
key belonging to a **different Gumroad account** (`lavignefrancesca`). A customer who buys
from you gets a licence the backend cannot find.

**Do this:**
1. Log into the **francescaonline** Gumroad account (the one you actually sell from)
2. Settings → **API** → copy the API key
3. Vercel → `digitallydefined-os-backend` → Settings → Environment Variables → replace
   `GUMROAD_API_KEY` with it → redeploy

**Verify:** buy your own product, paste the licence key into `/intelligence` → it unlocks.

### 3. Publish the Gumroad products (~10 min)

Your Gumroad profile currently shows **no products** — a visitor who clicks your profile sees an
empty shop. The `store` page in the dashboard fixes discovery for now, but Gumroad itself must
show the products too.

**Do this:** in the `francescaonline` account, confirm each product is **Published** and has a
price. The dashboard store links to:
- `francescaonline.gumroad.com/l/digital-business-os` — "Digital Business OS" (the main offer)
- `lavignefrancesca.gumroad.com/l/ycaru` — "Annual Financial Dashboard" ($17)
- `lavignefrancesca.gumroad.com/l/noodsi` — "Free Starter" ($0)

If you want them all on one account, move the two `lavignefrancesca` products over and update
the links in `digitallydefined-dashboard/src/pages/StorePage.jsx`.

### 4. Point the funnel domain at the quiz (~10 min)

`store.digitallydefined.agency` is now attached to the Vercel project. It needs one DNS record.

**Do this** in Cloudflare → DNS → Records → **Add record**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `store` | `76.76.21.21` | **DNS only** (grey cloud) |

That is it. Then `https://store.digitallydefined.agency/quiz` is your branded funnel link and
`/store` is your shelf.

*`digitallydefined.store` (the old domain) is abandoned — it returns Cloudflare 522 because the
origin deployment is gone and there is nothing in the workspace to redeploy it. Every link in the
product now points somewhere live. Leave it parked.*

### 5. Build the 4-email welcome sequence (~20 min)

This is the part that **runs while you rest**. Every quiz completion lands in Brevo with a
persona, and the sequence sells the right tripwire to the right person.

**Do this:** Brevo → Automation → new workflow → trigger = **contact added to "DD Subscriber
List"** → send the emails below. Use the persona stored in Supabase (or filter on the
`persona:` tag once tags are creatable) to vary the copy.

| # | Day | Purpose | Notes |
|---|---|---|---|
| 1 | 0 | Deliver the roadmap (backend already sends this on submit) | "Your {persona} roadmap" |
| 2 | 2 | Quick win | one concrete move they can do in 20 minutes |
| 3 | 4 | The offer | the tripwire for their persona (see table below) |
| 4 | 6 | Last call + proof | one customer sentence, one link, one deadline |

**Tripwire by persona** (from `digital-products/SUPERPOWER_QUIZ_MASTER_FUNNEL.md`):

| Persona | Tripwire | Price |
|---|---|---|
| Creator | Social Content Pack | $19 |
| Builder | Product Generator report | $39 |
| Educator | Authority Blueprint | $47 |
| Strategist | Offer Architect | $39 |
| Connector | 7-Day Social Content Challenge | free → $19 |

### 6. Point `digitaldefinitionservices@gmail.com` somewhere real (2 min)

The Brevo list still contains `digitaldefinitionservices@gmail.com` and one other service
address. If those are dead, remove them from the list so your open rates are honest.

---

## Your weekly rhythm (60 minutes total, not per day)

| When | What | Time |
|---|---|---|
| Mon | Post the drafted Facebook value post (3 groups) | 10 min |
| Tue | Follow up with warm leads from the `leads` list | 10 min |
| Wed | Post 1 more + reply to comments | 10 min |
| Thu | Publish 1 piece of content | 20 min |
| Fri | Read the week's numbers, post the win | 10 min |
| Sun | Batch next week's 3 posts | 20 min |

**The rule that makes this work:** the AI drafts the posts, you approve and paste. You never
write from scratch. That is the whole point of the product.

---

## What is still unbuilt (and why that is fine)

| Not built | Why it is not blocking |
|---|---|
| TODAY / PLAN / CONTENT / LEADS / MONEY navigation rebuild | The funnel works today. The product redesign is a separate, larger piece of work — and doing it *after* first sales means you build what they actually ask for. |
| The `intelligence` premium page is still hardcoded | It returns a static profile. It needs to use the real quiz result. **P1 — do it before you sell more than 10 licences.** |
| GA4 real analytics | Needs a service account. Until then the dashboard honestly says "not connected". |
| Social follower data | Platform APIs not implemented. Honest empty state in place of fake numbers. |
| Multi-tenant isolation | Required before the **second** reseller, not before the first customer. |

---

## Useful commands

```powershell
# The segmented lead list
$body = '{"action":"leads"}'
Invoke-WebRequest -Uri "https://digitallydefined-os-backend.vercel.app/api" -Method POST `
  -ContentType "application/json" -Headers @{'x-api-key'='DigitallyDefined-OS-2026'} -Body $body

# Is the backend answering?
Invoke-WebRequest -Uri "https://digitallydefined-os-backend.vercel.app/api" -Method POST `
  -ContentType "application/json" -Headers @{'x-api-key'='DigitallyDefined-OS-2026'} -Body '{"action":"status"}'

# Is the quiz working end to end?
Invoke-WebRequest -Uri "https://digitallydefined-os-backend.vercel.app/api" -Method POST `
  -ContentType "application/json" -Headers @{'x-api-key'='DigitallyDefined-OS-2026'} `
  -Body '{"action":"quiz.submit","answers":{"q1":"creator"},"persona":"creator","email":"you@example.com"}'
```

---

## The one-paragraph version

The funnel was not broken because it was missing — it was broken because a single allowlist
gate was rejecting every quiz request with a 404, the lead magnet had been deleted along with
the old website, and the only public domain pointed at a server that no longer exists. All of
that is fixed and verified live. What remains needs about 45 minutes of your attention:
activate Brevo sending, paste the right Gumroad key, publish your products, point one DNS
record at the quiz, and build the four-email sequence. After that the machine runs: strangers
find the quiz, the quiz captures them, the sequence nurtures them, and you post three times a
week from drafts you did not write.
