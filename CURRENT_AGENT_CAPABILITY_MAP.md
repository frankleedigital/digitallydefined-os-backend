# CURRENT AGENT CAPABILITY MAP
*As-Built Functional Inventory of the DigitallyDefined Agent Ecosystem*

---

## I. Summary of Functional Tiers
Across the 20 registered agents in `src/agents/index.js` and `src/agents/hub.js`, capabilities fall into two distinct execution tiers:
1. **Fully Executable (Deterministic Engine + AI Reasoning + Live Backend Endpoint):** Can be invoked directly via `agents.run` or the dashboard Agent Hub, returning structured JSON results, calculations, and content matrices.
2. **Display / Speculative / Architectural Stub:** Listed in registries or categories, but lacking a dedicated active execution module or handler.

---

## II. Detailed Agent Capability Breakdown

### 1. Discovery Agents (7 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Digital Superpower** | `quiz` | ✅ **Fully Executable** | Processes quiz answers, computes superpower persona and roadmap, syncs contact to Brevo. |
| **Niche Intelligence** | `niche` | ✅ **Fully Executable** | Analyzes niche demand, competition, and monetization using Vertex Gemini + fallback. |
| **Opportunity Scanner** | `opportunities` | ✅ **Fully Executable** | Identifies market gaps, quick wins, and product opportunities for a given niche/budget. |
| **Trend Intelligence** | `trends` | ✅ **Fully Executable** | Identifies trending topics and emerging market demand. |
| **Competition Scout** | `competition` | ✅ **Fully Executable** | Analyzes competitive landscape for a target niche. |
| **Audience Insight** | `audience` | ✅ **Fully Executable** | Generates audience demographics, psychographics, and persona profiles. |
| **Performance Scorecard** | `scorecard` | ✅ **Fully Executable** | Evaluates business performance across multiple operational dimensions. |

### 2. Creation Agents (3 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Product Generator** | `product` | ✅ **Fully Executable** | Generates digital product concepts, features, and launch strategies. |
| **Offer Architect** | `productAgent` | ✅ **Fully Executable** | Hermes specialist agent handling product creation, Gumroad strategy, bundles, and pricing. |
| **Authority Blueprint** | `roadmap` | ✅ **Fully Executable** | Generates multi-phase strategic roadmaps and milestones. |

### 3. Content Agents (2 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Social Content** | `social` | ✅ **Fully Executable** | Creates platform-specific social media content and post copy. |
| **Content Repurposer** | `contentAgent` | ✅ **Fully Executable** | Hermes specialist agent handling blog posts, email sequences, lead magnets, and sales copy. |

### 4. Digital Real Estate Agents (1 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Rank-and-Rent / Growth** | `growthAgent` | ✅ **Fully Executable** | Hermes specialist agent handling keyword clustering, topical authority, SEO strategy, and traffic growth. |

### 5. Financial Resilience Agents (4 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Retirement Gap** | `retirementGap` | ✅ **Fully Executable** | Calculates monthly retirement income gap, nest egg target, and required asset yield. |
| **Wealth Calculator** | `wealthCalculator` | ✅ **Fully Executable** | Projects 12/24/36-month net-worth trajectory and digital asset compound growth. |
| **Asset Plan** | `assetPlan` | ✅ **Fully Executable** | Recommends specific digital assets to build/acquire to close the retirement gap. |
| **Legacy OS** | `legacyOS` | ✅ **Fully Executable** | Evaluates Plan, Protect, and Operate 3-pillar readiness for sovereign financial independence. |

### 6. Revenue & Governance Agents (2 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Affiliate Flipper AI** | `affiliateFlipper` | ✅ **Fully Executable** | Analyzes traffic-to-product match, computes Traffic/Monetization/Flip scores (0-100), estimates revenue scenarios, and generates multi-channel content opportunities. |
| **Brand Supervisor AI** | `brandSupervisor` | ✅ **Fully Executable** | Audits copy, product descriptions, social posts, and landing page specs against the DigitallyDefined Brand Constitution (No-BS Big Bestie voice, Flat Soft Brutalism aesthetic, 6 Pillars). |

### 7. Hermes Orchestrator Agents (1 Registered)
| Agent Name | Registry Key | Execution Status | What It Actually Does |
|---|---|---|---|
| **Business Agent** | `businessAgent` | ✅ **Fully Executable** | Agency strategy, SEO, lead generation, client acquisition, and reputation management. |

---

## III. Active Automations & Workflows
1. **Daily Morning Brief & Slack Dispatch (`/api/cron-morning`):** Automated 7:30 AM cron that builds empire briefs, emails them, and pushes summaries to Slack.
2. **Daily Slack Empire Report (`/api/cron-daily-report`):** Automated 6:00 AM cron (`0 11 * * *`) that posts financial and traffic metrics to Slack.
3. **Quiz Lead Onboarding Hook (`quizDispatch.js`):** Real-time event handler that syncs leads to Brevo and fires an instant Slack notification (`*New quiz lead*`).
4. **GitHub Code Edits (`businessPartner.js`):** Automated diff generator that proposes website code changes with human approval gates.
