# ONBOARDING_IMPLEMENTATION_PLAN.md

## Screen-by-screen plan

1. Digital Independence Score — DB: Ideas & Intake (Digital Independence Score, Money Urgency, No-Go Zones). New props: none (existing). Linked views: single record. Progress: score stored. Empty state: prompt quiz. Widget: score card.

2. Start Here — DB: Ideas & Intake. Props: Name, Status, Source. New: none. Views: intake form. Progress: status=Draft. Empty: welcome. Widget: welcome card.

3. Ideas & Intake — DB: Ideas & Intake. Props: Name, Source, Niche, Suggested Assets, Digital Independence Score. Views: table. Progress: record count. Empty: add first idea. Widget: ideas list.

4. Choose Your First Assets — DB: Digital Assets. Props: Portfolio Role, Asset Stage, Launch Date. Views: filtered by stage=Idea. Progress: selected assets. Empty: suggest assets. Widget: asset picker.

5. Build Your First Asset — DB: Digital Assets. Props: Build Status, Asset Stage, Launch Date, Content Pillar. Views: kanban by Build Status. Progress: status transitions. Empty: start build. Widget: build tracker.

6. Portfolio Home — DB: Digital Assets. Props: Portfolio Role, AssetValue, Status. Views: grouped by Portfolio Role. Progress: asset count. Empty: no assets. Widget: portfolio summary.

7. Money Snapshot — DB: Money Snapshot. Props: Revenue, Expenses, Net, Month. Views: table. Progress: monthly entries. Empty: add first month. Widget: revenue chart.

8. Monthly Rhythm — DB: Monthly Review. Props: Period, Wins, Risks, NextActions. Views: table. Progress: review count. Empty: first review. Widget: monthly review list.

## Database mappings
Ideas & Intake, Digital Assets, Money Snapshot, Monthly Review, Products, Opportunities, Build Requests, Customer Intelligence.

## UI requirements
Notion linked views, filters by status/stage, rollups for counts.

## Build order
1 Score -> 2 Start Here -> 3 Ideas -> 4 Choose Assets -> 5 Build -> 6 Portfolio -> 7 Money -> 8 Monthly.

## Estimated effort
Medium (2-3 weeks) — mostly Notion UI configuration + feedback wiring.
