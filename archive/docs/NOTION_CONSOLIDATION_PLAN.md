# NOTION_CONSOLIDATION_PLAN.md

## Audit summary
~30 databases; many duplicates (Ideas & Intake x3, PDF Intake x2, Monthly Review x3, Money Snapshot x3, Templates Library x3, Content Blocks x2, Digital Assets x3, Automations Log x3, Reputation Signals x3, Customer variants x9).

## Duplicate/overlap identification
- Ideas & Intake (3) -> merge into Products/Opportunities
- PDF Intake (2) + PDF Intake (Customer) -> merge into Assets
- Monthly Review (3) -> merge into Analytics
- Money Snapshot (3) -> merge into Analytics
- Templates Library (3) -> merge into Assets
- Content Blocks (2) -> merge into Products
- Digital Assets (3) -> merge into Assets
- Automations Log (3) -> merge into Analytics
- Reputation Signals (3) -> merge into Customer Intelligence
- Customer variant DBs (9) -> archive (redundant copies)

## Recommendations
Merge: all duplicate/variant DBs into 8 core DBs.
Keep: canonical 8 core DBs (Products, Customer Intelligence, Opportunities, Build Requests, Assets, Roadmaps, Users, Analytics).
Archive: duplicate/variant DBs into _ARCHIVE page.

## Migration plan
1. Identify canonical records in each duplicate.
2. Migrate records into target core DB (via Notion API or manual).
3. Verify counts.
4. Archive source DBs (move to _ARCHIVE page, do not delete).
5. Update env vars to point to canonical DB IDs.

## Hermes rules (updated)
- Creates records only.
- Cannot create databases.
- Cannot create parent pages.
- Must search existing databases first.

## Antigravity rules (updated)
- Must use existing databases whenever possible.
- No database creation without explicit authorization.
