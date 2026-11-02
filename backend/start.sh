#!/bin/bash
set -e
python migrate_shared_db.py
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
