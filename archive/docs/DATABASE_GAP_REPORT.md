# DATABASE_GAP_REPORT.md

## Required vs Existing
None of the 7 required Hermes databases exist in Notion (search returned 0 matches for Customer Feedback, Feature Requests, Product Requests, Demand Signals, Opportunities, Hermes Insights, Build Requests).

## Env vars present
NOTION_API_KEY present. NOTION_PARENT_PAGE_ID not set (required to create databases via API).

## Provisioning
Script created: scripts/provision-hermes-dbs.mjs (requires NOTION_PARENT_PAGE_ID).

## Required env vars (to add after provisioning)
NOTION_CUSTOMER_FEEDBACK_DB_ID
NOTION_FEATURE_REQUESTS_DB_ID
NOTION_PRODUCT_REQUESTS_DB_ID
NOTION_DEMAND_SIGNALS_DB_ID
NOTION_OPPORTUNITIES_DB_ID
NOTION_HERMES_INSIGHTS_DB_ID
NOTION_BUILD_REQUESTS_DB_ID

## Validation
Blocked until NOTION_PARENT_PAGE_ID is provided and script is run.
