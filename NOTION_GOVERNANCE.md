# NOTION_GOVERNANCE.md

## Rules
1. No new databases without explicit approval.
2. No new parent pages without explicit approval.
3. Hermes may only create records (pages in existing DBs).
4. Antigravity must search existing databases first.
5. All new opportunities -> Opportunities DB.
6. All feedback -> Customer Intelligence DB.
7. All product ideas -> Products DB.
8. Archive never delete.

## Enforcement
Hermes intelligence layer (lib/hermesIntelligence.js) only calls POST /v1/pages with parent.database_id. No POST /v1/databases. No page creation without database parent. Guard: assertNoDbCreation() throws if attempted.
