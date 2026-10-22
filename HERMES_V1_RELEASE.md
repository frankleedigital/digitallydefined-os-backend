# HERMES V1 RELEASE

## Architecture
Hermes Intelligence Layer: Notion-backed persistence + Slack notifications + demand scoring + opportunity engine + build request generator.

## Databases
Customer Feedback, Feature Requests, Product Requests, Demand Signals, Opportunities, Hermes Insights, Build Requests (Notion, under _SYSTEM page).

## Automations
Demand scoring, opportunity creation (threshold-based), build request generation (score>=80), Slack notifications, briefings.

## Slack Events
notifyOpportunity, notifyBuildRequest, notifyBriefing.

## Build Requests Workflow
Opportunity score >= 80 -> createBuildRequest -> Notion Build Requests DB -> assigned to Notion Architect.

## Notion Architect Workflow
Build requests include product concept, audience, features, required databases, evidence, revenue potential.

## Known Limitations
- Automated signal generation from all user events not yet wired.
- FeedbackWidget only on IntelligencePage + imported on DashboardPage.
- Slack channels not yet provisioned (util ready).
- Notion DB IDs require env vars.

## V2 Enhancements
- Full event-driven signal automation.
- Global FeedbackWidget mounting.
- Slack channel provisioning + slash commands.
- PDF Intelligence Engine integration.
