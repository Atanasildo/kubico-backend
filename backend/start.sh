#!/bin/bash
set -e
cd /opt/render/project/src/backend
export PYTHONPATH=/opt/render/project/src/backend
python init_db.py
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
