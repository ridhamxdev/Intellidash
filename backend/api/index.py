"""
api/index.py
Vercel serverless entry point — re-exports the FastAPI app from main.py.
Vercel looks for `app` in this file when framework is set to fastapi.
"""
import sys
import os

# Make sure the backend root is on the path so all sibling modules resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app  # noqa: F401  — Vercel picks up `app` from here
