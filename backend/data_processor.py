"""
data_processor.py
Handles CSV/Excel ingestion, preprocessing, and data quality scoring.
"""

import io
import json
import pandas as pd
import numpy as np
from typing import Optional


# ─── In-memory store (single-session) ────────────────────────────────────────
_store: dict = {
    "raw": None,       # original DataFrame
    "clean": None,     # cleaned DataFrame
    "filename": None,
    "quality_before": 0.0,
    "quality_after": 0.0,
}


def get_store() -> dict:
    return _store


def _quality_score(df: pd.DataFrame) -> float:
    """Return a 0-100 data quality score based on completeness and uniqueness."""
    if df.empty:
        return 0.0
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = df.isnull().sum().sum()
    dup_rows = df.duplicated().sum()
    completeness = 1 - (missing_cells / total_cells) if total_cells > 0 else 1
    uniqueness = 1 - (dup_rows / len(df)) if len(df) > 0 else 1
    score = (completeness * 0.7 + uniqueness * 0.3) * 100
    return round(score, 2)


def load_file(content: bytes, filename: str) -> dict:
    """Parse uploaded bytes into a DataFrame and store it."""
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "csv":
        df = pd.read_csv(io.BytesIO(content))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    _store["raw"] = df.copy()
    _store["clean"] = df.copy()
    _store["filename"] = filename
    _store["quality_before"] = _quality_score(df)
    _store["quality_after"] = _store["quality_before"]

    return _build_summary(df, filename)


def load_sample() -> dict:
    """Load the bundled sample sales dataset."""
    import os
    path = os.path.join(os.path.dirname(__file__), "sample_data", "sales_data.csv")
    df = pd.read_csv(path)
    _store["raw"] = df.copy()
    _store["clean"] = df.copy()
    _store["filename"] = "sales_data.csv"
    _store["quality_before"] = _quality_score(df)
    _store["quality_after"] = _store["quality_before"]
    return _build_summary(df, "sales_data.csv")


def _build_summary(df: pd.DataFrame, filename: str) -> dict:
    """Return metadata dict for the loaded dataset."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    date_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower()]

    missing_per_col = df.isnull().sum().to_dict()
    missing_pct = round(df.isnull().sum().sum() / (df.shape[0] * df.shape[1]) * 100, 2)

    return {
        "filename": filename,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "date_columns": date_cols,
        "missing_per_column": {k: int(v) for k, v in missing_per_col.items()},
        "missing_percentage": missing_pct,
        "duplicate_rows": int(df.duplicated().sum()),
        "quality_score": _quality_score(df),
        "memory_kb": round(df.memory_usage(deep=True).sum() / 1024, 2),
    }


def preprocess(
    strategy: str = "mean",
    drop_duplicates: bool = True,
) -> dict:
    """
    Clean the stored DataFrame.
    strategy: 'drop' | 'mean' | 'median' | 'mode'
    """
    df = _store["raw"]
    if df is None:
        raise ValueError("No dataset loaded. Upload a file or load sample data first.")

    df = df.copy()
    before_rows = len(df)
    before_missing = int(df.isnull().sum().sum())

    # Handle missing values
    if strategy == "drop":
        df = df.dropna()
    else:
        for col in df.columns:
            if df[col].isnull().sum() == 0:
                continue
            if df[col].dtype in [np.float64, np.int64, float, int]:
                if strategy == "mean":
                    df[col] = df[col].fillna(df[col].mean())
                elif strategy == "median":
                    df[col] = df[col].fillna(df[col].median())
                elif strategy == "mode":
                    df[col] = df[col].fillna(df[col].mode()[0])
            else:
                # Categorical: always fill with mode
                if not df[col].mode().empty:
                    df[col] = df[col].fillna(df[col].mode()[0])

    # Remove duplicates
    dup_removed = 0
    if drop_duplicates:
        before_dup = len(df)
        df = df.drop_duplicates()
        dup_removed = before_dup - len(df)

    after_rows = len(df)
    after_missing = int(df.isnull().sum().sum())

    _store["clean"] = df
    _store["quality_after"] = _quality_score(df)

    # Build missing heatmap data (column → missing count)
    missing_heatmap = _store["raw"].isnull().sum().to_dict()

    return {
        "rows_before": before_rows,
        "rows_after": after_rows,
        "rows_removed": before_rows - after_rows,
        "duplicates_removed": dup_removed,
        "missing_before": before_missing,
        "missing_after": after_missing,
        "strategy_used": strategy,
        "quality_before": _store["quality_before"],
        "quality_after": _store["quality_after"],
        "missing_heatmap": {k: int(v) for k, v in missing_heatmap.items()},
        "preview": _df_preview(_store["clean"], page=1, page_size=10),
    }


def _df_preview(df: pd.DataFrame, page: int = 1, page_size: int = 10) -> dict:
    """Return a paginated JSON-serialisable preview of the DataFrame."""
    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    slice_df = df.iloc[start:end].copy()

    # Convert non-serialisable types
    for col in slice_df.columns:
        if slice_df[col].dtype == "object":
            slice_df[col] = slice_df[col].astype(str)
        elif pd.api.types.is_datetime64_any_dtype(slice_df[col]):
            slice_df[col] = slice_df[col].dt.strftime("%Y-%m-%d")

    return {
        "columns": slice_df.columns.tolist(),
        "rows": slice_df.replace({np.nan: None}).to_dict(orient="records"),
        "total_rows": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


def get_preview(page: int = 1, page_size: int = 10) -> dict:
    df = _store["clean"]
    if df is None:
        raise ValueError("No dataset loaded.")
    return _df_preview(df, page, page_size)
