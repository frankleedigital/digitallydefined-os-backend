# IDEAS_INTAKE_UX_AUDIT.md

## UX audit findings
Current Ideas & Intake mixes user input and AI analysis fields, creating confusion. Form assumes every entry is a new idea; existing assets (products, websites, services) not well supported.

## Updated form architecture
Intake Mode selector: New Idea / Existing Product / Existing Asset / Portfolio Audit.
Section A (user input): Idea/Asset Name, Idea Type, Audience, Problem Solved, Transformation, Existing Template URL, Proof Asset Link, Monetization Type, Source Materials Ready, Needs Research.
Section B (Antigravity-generated, read-only): Portfolio Role, Price Potential, Demand Confidence, Evergreen Potential, Build Effort, Speed to Launch, Authority Reason, Repurpose Opportunities, Can Antigravity Help, Can MCP Structure It, Priority Score, Strategic Recommendation.

## Fields moved to Antigravity analysis
Portfolio Role, Price Potential, Demand Confidence, Evergreen Potential, Build Effort, Speed to Launch, Authority Reason, Repurpose Opportunities, Can Antigravity Help, Can MCP Structure It, Priority Score, Strategic Recommendation.

## Fields remaining user-editable
Idea/Asset Name, Idea Type, Audience, Problem Solved, Transformation, Existing Template URL, Proof Asset Link, Monetization Type, Source Materials Ready, Needs Research, Intake Mode.

## Database changes required
None (reuse Ideas & Intake DB). Optionally add "Intake Mode" select property.

## View changes required
Split form into Section A (editable) and Section B (read-only generated). Add intake mode filter.

## Onboarding changes required
Update messaging: "Your job is to provide facts. Antigravity analyzes opportunity, fit, monetization, portfolio role, priority, next action."

## Migration plan
1. Add Intake Mode property.
2. Mark Section B fields as read-only/generated.
3. Update onboarding copy.
4. No data migration needed.
