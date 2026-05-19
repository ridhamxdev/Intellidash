"""
api/index.py
Vercel serverless entry point for the IntelliDash FastAPI backend.

Vercel's @vercel/python builder looks for an ASGI `app` object in this file.
We add the backend root to sys.path so all sibling modules (data_processor,
eda_engine, ml_engine, report_generator) can be imported normally.
"""
import sys
import os

# Add the backend root directory to the Python path
# so imports like `import data_processor` resolve correctly.
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

from main import app  # noqa: F401 — Vercel picks up `app` from here
