# REVENUE PATH AUDIT — Cold Visitor → First Purchase
**2026-11-10 · Hermes, CRO/revenue-engineer mode · Read-only audit (no changes made)**
Every step verified in `DigitallyDefinedClean` code + live Vercel probes.

**Journey audited:** Visitor → Landing → Quiz → Results → (AI Roadmap) → Dashboard → Growth Recommendations → DBO Offer → Checkout → Revenue

## Status legend
✅ working · 🟡 partial · 🟥 dead end · 🟨 fake/placeholder · ⛔ broken · ⛔❓ unverified

---

## STEP 1 — Entry points (where a cold visitor lands)
| Item | State | Finding |
|---|---|---|
| `dashboard.digitallydefined.agency/` | 🟥 | On the dashboard domain, `/` redirects to **`/dashboard` → login wall**. A cold visitor with no account **bounces to auth**. The quiz (`/quiz`, public) is reachable only by typing the URL — it is NOT the landing experience. |
| Vercel preview domains `/` | ✅ | Redirect to `/store` (funnel logic exists, but preview URLs are not where customers land) |
| `digitallydefined.agency` (marketing) | 🟥 | Domain down (000). No marketing entry exists. |
| `digitallydefined.store` | 🟥 | 522/525, origin down. |
| **Purpose check** | | The vision says visitors enter via marketing → quiz. **Today there is no working front door at all** — the only live surface is an authenticated app. |

**Recommended fix:** Make `/` on the dashboard domain a public **funnel home** (value prop + "Take the quiz" + DBO offer), keep `/dashboard` for logged-in users. One-line route change; the biggest single lever in the whole system.

## STEP 2 — Homepage / funnel home
| Item | State | Finding |
|---|---|---|
| `homePage` (App.jsx) | 🟥 | As above — it's a redirect, not a page. |
| `PUBLIC_SITE` constant | 🟨 | Points at the DBO Gumroad product — the "public site" is literally a checkout URL. Misleading. |

## STEP 3 — Quiz (`/quiz`)
| Item | State | Finding |
|---|---|---|
| 5 questions × 5 options → 5 personas | ✅ | `lib/quiz/questions.js`, deterministic, fast, mobile-friendly |
| Scoring | ✅ | `scoreQuiz` frequency scoring + confidence; pure, no AI needed |
| Storage | ✅ | answers in `localStorage("dd-quiz-results")` — survives refresh |
| **Break** | 🟥 | No path from a *logged-out visitor* anywhere after the quiz: results screen offers only email capture. The "dashboard" side of the journey (steps 5–8) **requires an account the visitor may not have**. |

## STEP 4 — Quiz results (`/quiz/results`)
| Item | State | Finding |
|---|---|---|
| Roadmap shown first | ✅ | Static persona roadmap renders instantly, no dependency |
| "AI Roadmap" | 🟨 | **Not AI** — 5 canned roadmaps. The vision's "AI roadmap" does not exist. |
| Email capture → `quiz.submit` | ✅/⛔ | POST works → Supabase `quiz_roadmaps` ✅ (real leads: 1 in 30d). Brevo roadmap email ❌ upstream Brevo 401 → nurture dead (visitor unaffected by design) |
| **Missing** | 🟥 | **No offer.** No DBO/audit/affiliate CTA. The monetization step after "aha" is absent. |

## STEP 5 — Dashboard onboarding (account side)
| Item | State | Finding |
|---|---|---|
| `/onboarding` (OnboardingPage) | 🟨 | Shell only: "Content coming soon." per step. No onboarding content. |
| `/intake` (IntakeWizard), `/review` (ReviewCenter) | 🟡 | Built internal-ops pages; unclear value to a *customer* |
| `onboarding.progress` (backend) | 🟨 | Counts **Notion** DBs (legacy dependency; `DD_USE_NOTION` toggle exists) |
| **Break** | 🟥 | A quiz-taker who signs up lands on a 10-tab command center of owner-ops (Brain/Intel/Automations/Reputation/Notion) — **none of which is about *their* business** |

## STEP 6 — Dashboard (post-login home)
| Item | State | Finding |
|---|---|---|
| DashboardPage: 10 tabs | 🟨 | Mix of real (Growth GA, Integrations) and fake (Brain brief, Intel, Automations — see Truth vs Illusion). Customer sees owner's dashboards, not their growth plan. |
| BrainTab (`brain.brief`) | 🟨 | Hard-coded "One-sentence executive summary" with frozen 2026-05-25 timestamp |
| IntelTab (`intelligence`) | 🟨 | Hard-coded "Builder" superpower + canned roadmap |

## STEP 7 — Growth recommendations
| Item | State | Finding |
|---|---|---|
| GrowthTab | 🟡 | **Not a recommendation engine** — a "Connected Sources" status board (GA ✅ live now, Email ❌ Brevo, Social/Community ❌). No "your next move" output exists anywhere in the product. |
| AnalyticsPage | 🟡/⛔ | Real traffic data via Supabase `analytics` fn, but its "recommend" action is dead (needs retired `OMNIROUTE_API_KEY`; canned fallback arrays) |
| `affiliate.recommend` | ✅ | Deterministic engine (10 programs, signal→program map) — **works but has zero UI surface** → 0 clicks in 30d |

## STEP 8 — DBO offer
| Item | State | Finding |
|---|---|---|
| StorePage `/store` | 🟡 | 3 cards (DBO $27 "Most popular", AFD $17, Free Starter $0) + quiz entry. **Only shelf that can take money.** |
| Price truth | 🟨 | DBO = **$27 here, $49 in `gumroad.js`**; two different Gumroad accounts (francescaonline / lavignefrancesca) |
| DBO product itself | ⛔❓ | `digital-products` app (renders the actual product, Puter Cloud state) is **local-only, not deployed** — the Gumroad listing may be a file/empty product **[UNVERIFIED]** |

## STEP 9 — Checkout
| Item | State | Finding |
|---|---|---|
| Gumroad (external) | ✅ | Only live checkout; purchase happens off-platform; **no purchase tracking** (`gumroad_sales` table exists in query but nothing writes to it → `gumroadSales` is structurally 0) |
| PayPal in-app (`product.purchase`) | ⛔ | Fully built, honest "not configured" response — `PAYPAL_CLIENT_ID/SECRET` missing |

## STEP 10 — Post-purchase / email / retention
| Item | State | Finding |
|---|---|---|
| Brevo (quiz email + nurture) | ⛔ | `Brevo API request failed` (upstream 401) — the entire email leg is down |
| `subscribe` edge fn (NewsletterSignup) | ⛔ | **Function does not exist** in the canonical Supabase tree → newsletter box on the funnel errors silently |
| Purchase tracking | 🟥 | `paypal_orders`/`product_purchases` tables await migration (`20261110000000_revenue_platform.sql` **not applied**); Gumroad has no webhook |

## STEP 11 — Auth / user creation
| Item | State | Finding |
|---|---|---|
| Supabase auth (login/signup) | ✅ | Works (`/auth/callback` + AuthContext) |
| **Problem** | 🟥 | Auth is on the *wrong side* of the funnel: the value (quiz→roadmap) is public, the monetization sits behind a login the visitor hasn't earned yet. Inversion of the classic funnel. |

---

## BREAK MAP (where the visitor actually stops)
```
Cold visitor → "/" → LOGIN WALL                     🟥 BREAK #1 (front door is a door)
(typing /quiz works) → quiz → results → roadmap ✅
  → email capture (Brevo ⛔, but visitor keeps result)
  → …no offer, no next step                         🟥 BREAK #2 (funnel evaporates)
(sign up, if they still care) → 10-tab owner dashboard
  → Brain/Intel/Automations tabs                    🟨 FAKE DATA shown as live
  → /store → DBO $27 → GUMROAD (off-platform, untracked)  ⛔ BREAK #3 (revenue leaks out, no tracking)
```
**Three breaks, in order of revenue damage:** (1) front door is a login wall, (2) no offer at quiz result, (3) no purchase tracking/retention.

## THE 5 REPAIRS THAT RESTORE THE PATH (no new features)
1. **Public funnel home at `/`** on the dashboard domain (quiz CTA + DBO one-liner). *(½ day)*
2. **Offer card at `/quiz/results`** → DBO $27 Gumroad link (persona-aware copy). *(½ day)*
3. **Unify price/account** ($27, one account) + add a **Gumroad webhook** writing `gumroad_sales` → first tracked revenue. *(1 day)*
4. **Fix Brevo** (email leg) or swap the quiz email to a working provider *(1 day)*
5. **Replace the fake Brain/Intel/Automations tabs with ONE customer-facing "Your Growth Plan" screen** fed by the Central AI Brain (§ below). *(2–3 days)*
