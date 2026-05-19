"""
ml_engine.py
Machine Learning: Linear Regression forecasting with metrics and 30-day forecast.
"""

import numpy as np
import pandas as pd
from typing import Optional
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from data_processor import get_store


def run_regression(target_col: str, feature_col: Optional[str] = None) -> dict:
    """
    Fit a Linear Regression model.
    If feature_col is None, uses a numeric time index as the feature.
    Returns predictions, metrics, and a 30-day forecast.
    """
    df = get_store()["clean"]
    if df is None:
        raise ValueError("No dataset loaded.")

    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found.")

    # Build feature matrix
    if feature_col and feature_col in df.columns and feature_col != target_col:
        X_raw = df[[feature_col]].copy()
        # If feature is date-like, convert to ordinal
        if pd.api.types.is_datetime64_any_dtype(X_raw[feature_col]) or "date" in feature_col.lower():
            try:
                X_raw[feature_col] = pd.to_datetime(X_raw[feature_col], errors="coerce")
                X_raw[feature_col] = X_raw[feature_col].map(lambda x: x.toordinal() if pd.notna(x) else np.nan)
            except Exception:
                pass
        X_raw = X_raw.select_dtypes(include=[np.number])
    else:
        # Use row index as time proxy
        X_raw = pd.DataFrame({"index": np.arange(len(df))})

    y = df[target_col].copy()

    # Drop rows with NaN in X or y
    combined = pd.concat([X_raw.reset_index(drop=True), y.reset_index(drop=True)], axis=1).dropna()
    if len(combined) < 10:
        raise ValueError("Not enough clean data rows for regression (need at least 10).")

    X = combined.iloc[:, :-1].values
    y_vals = combined.iloc[:, -1].values

    # Train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_vals, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LinearRegression()
    model.fit(X_train_s, y_train)

    y_pred_test = model.predict(X_test_s)

    # Metrics
    r2 = r2_score(y_test, y_pred_test)
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    mape = float(np.mean(np.abs((y_test - y_pred_test) / (np.abs(y_test) + 1e-9))) * 100)

    # Full dataset predictions for chart
    X_all_s = scaler.transform(X)
    y_pred_all = model.predict(X_all_s)

    # Build actual vs predicted series (sorted by X for clean line chart)
    sort_idx = np.argsort(X[:, 0])
    actual_vs_pred = [
        {
            "index": int(i),
            "actual": round(float(y_vals[sort_idx[i]]), 4),
            "predicted": round(float(y_pred_all[sort_idx[i]]), 4),
        }
        for i in range(len(sort_idx))
    ]

    # 30-day forecast
    last_x = X[:, 0].max()
    step = (X[:, 0].max() - X[:, 0].min()) / max(len(X) - 1, 1)
    forecast_x = np.array([[last_x + step * (i + 1)] for i in range(30)])
    forecast_x_s = scaler.transform(forecast_x)
    forecast_y = model.predict(forecast_x_s)

    # Confidence interval: ±1.96 * residual std
    residuals = y_vals - y_pred_all
    residual_std = float(np.std(residuals))
    ci = 1.96 * residual_std

    forecast = [
        {
            "step": i + 1,
            "predicted": round(float(forecast_y[i]), 4),
            "lower": round(float(forecast_y[i] - ci), 4),
            "upper": round(float(forecast_y[i] + ci), 4),
        }
        for i in range(30)
    ]

    return {
        "target_column": target_col,
        "feature_column": feature_col or "row_index",
        "metrics": {
            "r2_score": round(float(r2), 4),
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
            "mape": round(float(mape), 4),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
        },
        "coefficients": {
            "intercept": round(float(model.intercept_), 6),
            "slope": round(float(model.coef_[0]), 6),
        },
        "actual_vs_predicted": actual_vs_pred[:200],  # cap for payload size
        "forecast_30_days": forecast,
        "residual_std": round(residual_std, 4),
        "confidence_interval": round(ci, 4),
    }


def available_numeric_columns() -> list:
    df = get_store()["clean"]
    if df is None:
        return []
    return df.select_dtypes(include=[np.number]).columns.tolist()
