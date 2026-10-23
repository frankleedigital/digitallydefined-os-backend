"""Central settings — merges all config modules into one surface.

Backward-compatible: existing code that does `from .config import settings`
still works via re-export.
"""

from .google import (
    PROJECT_ID as GOOGLE_PROJECT_ID,
    LOCATION as GOOGLE_LOCATION,
    VERTEX_PROJECT_ID,
    VERTEX_LOCATION,
    VERTEX_API_KEY,
    VERTEX_MODEL,
    FIRESTORE_DATABASE,
    STORAGE_BUCKET,
    BIGQUERY_DATASET,
    check_google_cloud,
    get_vertex_client,
    get_firestore_client,
    get_storage_client,
    get_bigquery_client,
)
from .supabase import (
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    REST_URL as SUPABASE_REST_URL,
    is_configured as supabase_is_configured,
    get_headers as supabase_get_headers,
)
from .cloudflare import (
    CF_ACCOUNT_ID,
    CF_API_TOKEN,
    R2_BUCKET_PRODUCTS,
    R2_BUCKET_ASSETS,
    R2_PUBLIC_URL,
    is_r2_configured,
)
from .environment import (
    validateEnvironment,
    reportMissingVariables,
    startupHealthCheck,
    get_config_summary,
)