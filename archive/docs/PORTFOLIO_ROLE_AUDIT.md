# PORTFOLIO_ROLE_AUDIT.md

## Previously Reported Missing
Cash Now, Growth Engine, Authority, Retirement Builder, Revenue Goal, Asset Stage, Build Status, Content Pillar, Suggested Assets, Digital Independence Score.

## Actually Exists
Portfolio Role (select) with values: Cash Now, Growth Engine, Authority Asset, Retirement Builder. (Live in Digital Assets DB.)
Launch Date (date).
Confidence Score, Comfort Score, Money Urgency, No-Go Zones, Priority (various DBs).

## Truly Missing
Revenue Goal, Asset Stage, Build Status, Content Pillar, Suggested Assets, Digital Independence Score. (Not found in any live DB.)

## Duplicate Properties To Review
- Architect "Portfolio Role" select options use "Authority" but live DB uses "Authority Asset" — mismatch to reconcile.
- "Asset Stage" vs "Build Status" overlap (both track progress) — consider consolidating.
- "Content Pillar" not present anywhere — needs creation.
