# TOOL MONETIZATION MAP — where every interactive asset sits in the money stack
**Principle: tools deliver *themselves* (hosted link + file). No content production. PDFs support tools, not the other way around.**

## THE LADDER (lead magnet → subscription)
```
FREE LAYER — lead magnets (email-gated via lead.capture / public thank-you page)
  h04 Aged Domain Auditor        h33 Niche-Viability xlsx      h03 10x-ROI free tier + capture
  h30 Estate Docs + Scam Plan    h02 10x ROI (free tier)       h18 50-Prompts teaser (HTML)
        ↓
INTERACTIVE TOOLS — $17-47 (Gumroad: hosted link + download file)
  h01 Affiliate Flip Calculator  h02 10x ROI full report       h14 Digital Wealth Snapshot (paid tier)
  h15 Freedom Number Calc        h10 Unfiltered Balance Sheet   h07 Asset Audit Simulator
  h13 Catch-Up OS                h19 Intent to Income           h21 Business Plan Architect
        ↓
SUITE / BUNDLE PRODUCTS — $47-97
  h05 Rank & Rent Academy (incl. h04+h06+h08+h09+h17)          h11 Gen X Financial Power Suite
  h27 AI-Agent Pricing Worksheet + h28 Niche Card               h22 Faceless Kit + h23 + h24 + h25 + h26 Tools Pack
        ↓
PAYROLL / SYSTEM — $97-197
  a04+ a10 Digital Business OS (8-DB Notion system + tool suite + Antigravity architect)
        ↓
SUBSCRIPTION — $29-99/mo (post-proof)
  a03 Intelligence Dashboard fed by ai.brief (Growth OS)   a05 Hermes AI Partner weekly move   a12 Reputation CC (B2B)
        ↓
WHITE-LABEL / API (enterprise)
  a07 FastAPI knowledge service + a08 sellable/followup/optimization-loop fleet → tenant key (h34 brand kit)
```

## LAYER PLACEMENT (every one of the 49)
| Layer | Tools |
|---|---|
| **Free magnet** | h03, h04, h33, h02-free, h30, h18, h09(print), h34 |
| **Tool $17-47** | h01, h10, h13, h14, h15, h19, h20, h21, h24, h25, h26, h27, h28, h30-paid?, h11, h08, h17 |
| **Suite $47-97** | h05(R&A w/ cluster), h31(mined), h12, a02(React→standalone) |
| **System $97-197** | a01(quiz), a04(DBO), a10(storefront) |
| **Subscription** | a03, a05, a12, a15(optimization loops), a06(agent API) |
| **Infra (not sold direct)** | a07, a08, a09, a11, a14, h32, h34, h16, h29 |

## GUMROAD STRATEGY FOR TOOLS (per your correction: these sell on Gumroad as digital products)
1. **Deliverable = 1 file + 1 hosted link.** Each tool ships as its standalone HTML file (download) **and** the live `dashboard.digitallydefined.agency/<tool>.html` link (hosted, always current, zero maintenance).
2. **Batch the deploy:** move the ~12 sellable single-file tools into `digitallydefined-dashboard/public/` (like the live trio) → one Vercel deploy = all tools hosted, all links valid.
3. **Pricing from the Product Graph ladder:** calculators $17-27 · analyzers/optimizers $27-47 · platforms (Intent to Income, Catch-Up OS) $47-97 · suites (R&R Academy) $47-97 · DBO stays $97-197.
4. **The hosted link is the moat:** buyers who get the file *and* the link can argue value ("lifetime hosted access") — that line goes in every Gumroad description.
5. **Track it:** Gumroad webhook → `gumroad_sales` (Week 0 of the 90-day plan) so tool sales show in `revenue.snapshot` on day one.

## WHAT CHANGES VS THE PDF-FIRST VIEW
- The previous inventory priced the shelf around *documents*. This map inverts it: **the 6 highest Overall scores are software** (Quiz, R&R Academy, Unfiltered Balance Sheet, Freedom Number, Catch-Up OS, Wealth Snapshot).
- A polished calculator at $27 with a hosted link sells on *utility*, while a PDF sells on *trust* — the tools carry the repeat-purchase and the subscriptions.
- **One hosting deploy + one webhook = the entire tool-revenue machine.** That is the cheapest monetization path in the ecosystem.
