"""
eda_engine.py
Exploratory Data Analysis: summary stats, correlation, distributions, outliers.
"""

import numpy as np
import pandas as pd
from typing import Optional
from data_processor import get_store


def _get_df() -> pd.DataFrame:
    df = get_store()["clean"]
    if df is None:
        raise ValueError("No dataset loaded.")
    return df


# ─── Summary Statistics ───────────────────────────────────────────────────────

def summary_statistics() -> dict:
    df = _get_df()
    numeric = df.select_dtypes(include=[np.number])

    if numeric.empty:
        return {"stats": [], "categorical_stats": _categorical_stats(df)}

    desc = numeric.describe(percentiles=[0.25, 0.5, 0.75]).T
    desc["skewness"] = numeric.skew()
    desc["kurtosis"] = numeric.kurtosis()
    desc["missing"] = df[numeric.columns].isnull().sum()
    desc["missing_pct"] = (df[numeric.columns].isnull().sum() / len(df) * 100).round(2)

    stats = []
    for col in desc.index:
        row = desc.loc[col]
        stats.append({
            "column": col,
            "count": int(row.get("count", 0)),
            "mean": round(float(row.get("mean", 0)), 4),
            "std": round(float(row.get("std", 0)), 4),
            "min": round(float(row.get("min", 0)), 4),
            "q25": round(float(row.get("25%", 0)), 4),
            "median": round(float(row.get("50%", 0)), 4),
            "q75": round(float(row.get("75%", 0)), 4),
            "max": round(float(row.get("max", 0)), 4),
            "skewness": round(float(row.get("skewness", 0)), 4),
            "kurtosis": round(float(row.get("kurtosis", 0)), 4),
            "missing": int(row.get("missing", 0)),
            "missing_pct": float(row.get("missing_pct", 0)),
        })

    return {
        "stats": stats,
        "categorical_stats": _categorical_stats(df),
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
    }


def _categorical_stats(df: pd.DataFrame) -> list:
    cat_cols = df.select_dtypes(include=["object", "category"]).columns
    result = []
    for col in cat_cols:
        vc = df[col].value_counts()
        result.append({
            "column": col,
            "unique_values": int(df[col].nunique()),
            "top_value": str(vc.index[0]) if len(vc) > 0 else None,
            "top_count": int(vc.iloc[0]) if len(vc) > 0 else 0,
            "missing": int(df[col].isnull().sum()),
            "top_10": [
                {"value": str(k), "count": int(v)}
                for k, v in vc.head(10).items()
            ],
        })
    return result


# ─── Correlation Matrix ───────────────────────────────────────────────────────

def correlation_matrix() -> dict:
    df = _get_df()
    numeric = df.select_dtypes(include=[np.number])
    if numeric.shape[1] < 2:
        return {"columns": [], "matrix": [], "pairs": []}

    corr = numeric.corr(method="pearson")
    columns = corr.columns.tolist()

    # Full matrix for heatmap
    matrix = []
    for row_col in columns:
        row = []
        for col_col in columns:
            val = corr.loc[row_col, col_col]
            row.append(round(float(val), 4) if not np.isnan(val) else 0.0)
        matrix.append(row)

    # Top correlated pairs (excluding self-correlation)
    pairs = []
    seen = set()
    for i, c1 in enumerate(columns):
        for j, c2 in enumerate(columns):
            if i >= j:
                continue
            key = tuple(sorted([c1, c2]))
            if key in seen:
                continue
            seen.add(key)
            val = corr.loc[c1, c2]
            if not np.isnan(val):
                pairs.append({
                    "col1": c1,
                    "col2": c2,
                    "correlation": round(float(val), 4),
                    "strength": _corr_strength(abs(float(val))),
                })

    pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {"columns": columns, "matrix": matrix, "pairs": pairs[:20]}


def _corr_strength(r: float) -> str:
    if r >= 0.8:
        return "Very Strong"
    elif r >= 0.6:
        return "Strong"
    elif r >= 0.4:
        return "Moderate"
    elif r >= 0.2:
        return "Weak"
    return "Very Weak"


# ─── Distribution / Histogram ─────────────────────────────────────────────────

def column_distribution(column: str, bins: int = 20) -> dict:
    df = _get_df()
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found.")

    series = df[column].dropna()

    if pd.api.types.is_numeric_dtype(series):
        counts, edges = np.histogram(series, bins=bins)
        histogram = [
            {
                "bin_start": round(float(edges[i]), 4),
                "bin_end": round(float(edges[i + 1]), 4),
                "count": int(counts[i]),
                "label": f"{edges[i]:.1f}–{edges[i+1]:.1f}",
            }
            for i in range(len(counts))
        ]
        return {
            "column": column,
            "type": "numeric",
            "histogram": histogram,
            "mean": round(float(series.mean()), 4),
            "median": round(float(series.median()), 4),
            "std": round(float(series.std()), 4),
        }
    else:
        vc = series.value_counts().head(20)
        return {
            "column": column,
            "type": "categorical",
            "histogram": [
                {"label": str(k), "count": int(v)} for k, v in vc.items()
            ],
        }


# ─── Outlier Detection (IQR) ─────────────────────────────────────────────────

def detect_outliers() -> dict:
    df = _get_df()
    numeric = df.select_dtypes(include=[np.number])
    outlier_summary = []
    all_outlier_indices = set()

    for col in numeric.columns:
        series = df[col].dropna()
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        mask = (df[col] < lower) | (df[col] > upper)
        outlier_rows = df[mask].index.tolist()
        all_outlier_indices.update(outlier_rows)

        outlier_summary.append({
            "column": col,
            "q1": round(float(q1), 4),
            "q3": round(float(q3), 4),
            "iqr": round(float(iqr), 4),
            "lower_fence": round(float(lower), 4),
            "upper_fence": round(float(upper), 4),
            "outlier_count": int(mask.sum()),
            "outlier_pct": round(float(mask.sum() / len(df) * 100), 2),
        })

    # Sample of outlier rows (up to 50)
    outlier_df = df.loc[list(all_outlier_indices)].head(50).copy()
    for col in outlier_df.columns:
        if pd.api.types.is_datetime64_any_dtype(outlier_df[col]):
            outlier_df[col] = outlier_df[col].dt.strftime("%Y-%m-%d")
        elif outlier_df[col].dtype == object:
            outlier_df[col] = outlier_df[col].astype(str)

    return {
        "summary": outlier_summary,
        "total_outlier_rows": len(all_outlier_indices),
        "outlier_rows": outlier_df.replace({np.nan: None}).to_dict(orient="records"),
    }


# ─── Dashboard KPI Data ───────────────────────────────────────────────────────

def dashboard_kpis() -> dict:
    df = _get_df()
    store = get_store()
    numeric = df.select_dtypes(include=[np.number])
    total_missing = int(df.isnull().sum().sum())
    total_cells = df.shape[0] * df.shape[1]
    missing_pct = round(total_missing / total_cells * 100, 2) if total_cells > 0 else 0

    kpis = {
        "total_records": int(df.shape[0]),
        "numeric_columns": int(len(numeric.columns)),
        "missing_pct": missing_pct,
        "quality_score": store.get("quality_after", 0),
        "filename": store.get("filename", ""),
    }

    # Auto-detect which columns are being used for each chart
    detected = {
        "date_col": _find_date_col(df),
        "revenue_col": _find_revenue_col(df),
        "region_col": _find_region_col(df),
        "segment_col": _find_segment_col(df),
    }

    return {
        "kpis": kpis,
        "revenue_trend": _revenue_over_time(df),
        "sales_by_region": _sales_by_region(df),
        "customer_segmentation": _customer_segmentation(df),
        "monthly_trend": _monthly_trend(df),
        "detected_columns": detected,
    }


# ─── Smart column finders ─────────────────────────────────────────────────────

def _find_date_col(df: pd.DataFrame):
    """Return the best date-like column, or None."""
    # First: columns whose name strongly suggests a date
    strong_keywords = ["date", "time", "day", "created", "updated", "period", "week", "timestamp"]
    for kw in strong_keywords:
        for c in df.columns:
            if kw in c.lower():
                # Verify it actually parses as dates
                try:
                    parsed = pd.to_datetime(df[c], errors="coerce")
                    if parsed.notna().sum() > len(df) * 0.5:
                        return c
                except Exception:
                    pass

    # Fallback: any object column where >50% of values parse as real dates
    for c in df.select_dtypes(include=["object"]).columns:
        # Skip columns that are clearly categorical (low unique count, short strings)
        if df[c].nunique() < 10:
            continue
        try:
            sample = df[c].dropna().head(20)
            parsed = pd.to_datetime(sample, errors="coerce")
            if parsed.notna().sum() >= len(sample) * 0.8:
                return c
        except Exception:
            pass
    return None


def _find_revenue_col(df: pd.DataFrame):
    """Return the best numeric revenue/sales/profit column, or the largest-mean numeric col."""
    keywords = ["revenue", "sales", "gross", "net_sales", "income",
                "profit", "amount", "value", "price", "earning", "turnover"]
    for kw in keywords:
        for c in df.columns:
            if kw in c.lower() and pd.api.types.is_numeric_dtype(df[c]):
                return c
    # Fallback: numeric column with the highest mean (likely a monetary column)
    numeric = df.select_dtypes(include=[np.number])
    if numeric.empty:
        return None
    return numeric.mean().idxmax()


def _find_region_col(df: pd.DataFrame):
    """Return the best categorical column representing a geographic/group dimension."""
    keywords = ["region", "area", "zone", "location", "city", "state",
                "country", "store", "branch", "territory", "market", "site"]
    for kw in keywords:
        for c in df.columns:
            if kw in c.lower() and df[c].dtype == object:
                n_unique = df[c].nunique()
                if 2 <= n_unique <= 30:
                    return c
    # Fallback: any low-cardinality categorical column (not ID-like)
    for c in df.select_dtypes(include=["object"]).columns:
        n_unique = df[c].nunique()
        if 2 <= n_unique <= 20 and "id" not in c.lower():
            return c
    return None


def _find_segment_col(df: pd.DataFrame):
    """Return the best categorical column for segmentation/grouping."""
    keywords = ["segment", "type", "tier", "category", "class", "group",
                "level", "grade", "status", "kind", "department", "role",
                "education", "attrition", "promotion", "overtime"]
    for kw in keywords:
        for c in df.columns:
            if kw in c.lower() and df[c].dtype == object:
                n_unique = df[c].nunique()
                if 2 <= n_unique <= 15:
                    return c
    # Fallback: lowest-cardinality categorical column
    cat_cols = [(c, df[c].nunique()) for c in df.select_dtypes(include=["object"]).columns
                if 2 <= df[c].nunique() <= 10 and "id" not in c.lower()]
    if cat_cols:
        return min(cat_cols, key=lambda x: x[1])[0]
    return None


# ─── Dashboard chart builders ─────────────────────────────────────────────────

def _revenue_over_time(df: pd.DataFrame) -> list:
    date_col = _find_date_col(df)
    rev_col = _find_revenue_col(df)
    if not date_col or not rev_col:
        return []
    try:
        tmp = df[[date_col, rev_col]].copy()
        tmp[date_col] = pd.to_datetime(tmp[date_col], errors="coerce")
        tmp = tmp.dropna()
        if tmp.empty:
            return []
        tmp = tmp.sort_values(date_col).set_index(date_col)
        # Use weekly resampling if > 60 rows, else daily
        rule = "W" if len(tmp) > 60 else "D"
        resampled = tmp[rev_col].resample(rule).sum().reset_index()
        return [
            {"date": row[date_col].strftime("%Y-%m-%d"), "revenue": round(float(row[rev_col]), 2)}
            for _, row in resampled.iterrows()
        ]
    except Exception:
        return []


def _sales_by_region(df: pd.DataFrame) -> list:
    region_col = _find_region_col(df)
    rev_col = _find_revenue_col(df)
    if not region_col or not rev_col:
        return []
    try:
        grouped = df.groupby(region_col)[rev_col].sum().reset_index()
        grouped.columns = ["region", "revenue"]
        grouped["revenue"] = grouped["revenue"].round(2)
        return grouped.sort_values("revenue", ascending=False).head(10).to_dict(orient="records")
    except Exception:
        return []


def _customer_segmentation(df: pd.DataFrame) -> list:
    seg_col = _find_segment_col(df)
    if not seg_col:
        return []
    try:
        vc = df[seg_col].value_counts().head(10)
        return [{"segment": str(k), "count": int(v)} for k, v in vc.items()]
    except Exception:
        return []


def _monthly_trend(df: pd.DataFrame) -> list:
    date_col = _find_date_col(df)
    rev_col = _find_revenue_col(df)
    if not date_col or not rev_col:
        return []
    try:
        tmp = df[[date_col, rev_col]].copy()
        tmp[date_col] = pd.to_datetime(tmp[date_col], errors="coerce")
        tmp = tmp.dropna()
        if tmp.empty:
            return []
        tmp["month"] = tmp[date_col].dt.to_period("M")
        monthly = tmp.groupby("month")[rev_col].agg(["sum", "mean", "count"]).reset_index()
        return [
            {
                "month": str(row["month"]),
                "total_revenue": round(float(row["sum"]), 2),
                "avg_revenue": round(float(row["mean"]), 2),
                "transactions": int(row["count"]),
            }
            for _, row in monthly.iterrows()
        ]
    except Exception:
        return []
