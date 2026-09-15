"""
AgentOps Dashboard Test for DigitallyDefined
Initializes AgentOps and sends a sample session with traces to the dashboard.

Usage:
    python scripts/agentops_test.py

Set AGENTOPS_API_KEY in your environment (or .env) to override the default key.
View your dashboard at: https://app.agentops.ai
"""

import os

import agentops

API_KEY = os.getenv("AGENTOPS_API_KEY", "46af9929-ada4-4fc8-8679-fb9d92db3eb4")

agentops.init(api_key=API_KEY, project="DigitallyDefined")

# --- Sample traced workload so the dashboard has something to show ---
with agentops.start_trace("digitallydefined.smoke_test"):
    print("Doing some fake agent work...")

    with agentops.start_trace("digitallydefined.subtask"):
        result = sum(range(100))
        print(f"Subtask computed: {result}")

print("AgentOps is connected and logging!")
print("View your dashboard at: https://app.agentops.ai")

# Flush and end the session so all traces are exported before exit
agentops.end_session(exit_state="Success")

