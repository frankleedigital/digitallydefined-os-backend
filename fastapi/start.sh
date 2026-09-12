#!/usr/bin/env bash
# Start the DigitallyDefined FastAPI microservice layer with uvicorn.
# Usage: ./start.sh   (PORT env overrides the default 8000)
set -e
cd "$(dirname "$0")"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"