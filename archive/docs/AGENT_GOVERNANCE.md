# AGENT_GOVERNANCE.md

## Agents covered
Hermes, Notion Architect, Product Miner, Product Packager, future AI agents.

## Rules
1. Agents create records only (pages in existing DBs).
2. Agents cannot create databases.
3. Agents cannot create parent pages.
4. Agents must search existing records first before creating.
5. Agents must use canonical databases (per NOTION_CONSOLIDATION_PLAN).
6. Agents must respect archive policies (archive, never delete).
7. Build Requests are the only approved mechanism for creating new products.

## Operating procedures
- Hermes: intelligence + opportunity detection; writes to Customer Intelligence, Opportunities, Build Requests, Hermes Insights.
- Notion Architect: executes Build Requests only; creates product DB records.
- Product Miner: reads analytics/feedback; writes opportunities.
- Product Packager: packages approved products; writes to Products/Assets.
- Future agents: inherit these rules.

## Permissions
- Read: all canonical DBs.
- Write: records only in assigned DBs.
- Create DB/page: forbidden without explicit authorization.
