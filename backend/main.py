"""
main.py
IntelliDash FastAPI Backend — All API endpoints.
Run: uvicorn main:app --reload --port 8000
"""

import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import io
import traceback

import data_processor as dp
import eda_engine as eda
import ml_engine as ml
import report_generator as rg

app = FastAPI(
    title="IntelliDash API",
    description="AI-Powered Business Analytics Platform — Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# FRONTEND_URL env var is set in Render dashboard to your Vercel URL.
# Falls back to localhost for local development.
_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]
if _frontend_url:
    _allowed_origins.append(_frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": "IntelliDash",
        "version": "1.0.0",
        "author": "Aryan Chandak",
    }


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy", "message": "IntelliDash API is running."}


# ─── File Upload ──────────────────────────────────────────────────────────────
@app.post("/api/upload", tags=["Data"])
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file.
    Returns dataset summary: shape, dtypes, missing values, quality score.
    """
    allowed = {"csv", "xlsx", "xls"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed)}",
        )
    try:
        content = await file.read()
        summary = dp.load_file(content, file.filename)
        return {"success": True, "data": summary}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


# ─── Sample Data ──────────────────────────────────────────────────────────────
@app.get("/api/sample", tags=["Data"])
def load_sample():
    """Load the bundled sales_data.csv sample dataset."""
    try:
        summary = dp.load_sample()
        return {"success": True, "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Data Preview ─────────────────────────────────────────────────────────────
@app.get("/api/preview", tags=["Data"])
def preview_data(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=5, le=100, description="Rows per page"),
):
    """Return a paginated preview of the cleaned dataset."""
    try:
        return {"success": True, "data": dp.get_preview(page, page_size)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Preprocessing ────────────────────────────────────────────────────────────
@app.post("/api/preprocess", tags=["Preprocessing"])
def preprocess_data(
    strategy: str = Query("mean", description="Missing value strategy: drop | mean | median | mode"),
    drop_duplicates: bool = Query(True, description="Remove duplicate rows"),
):
    """
    Clean the loaded dataset.
    Returns quality report with before/after scores and cleaned data preview.
    """
    valid_strategies = {"drop", "mean", "median", "mode"}
    if strategy not in valid_strategies:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid strategy '{strategy}'. Choose from: {', '.join(valid_strategies)}",
        )
    try:
        result = dp.preprocess(strategy=strategy, drop_duplicates=drop_duplicates)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── EDA Endpoints ────────────────────────────────────────────────────────────
@app.get("/api/eda/summary", tags=["EDA"])
def eda_summary():
    """
    Return summary statistics for all numeric and categorical columns.
    Includes mean, median, std, min, max, quartiles, skewness, kurtosis.
    """
    try:
        return {"success": True, "data": eda.summary_statistics()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=traceback.format_exc())


@app.get("/api/eda/correlation", tags=["EDA"])
def eda_correlation():
    """Return Pearson correlation matrix and top correlated pairs."""
    try:
        return {"success": True, "data": eda.correlation_matrix()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/eda/distribution", tags=["EDA"])
def eda_distribution(
    column: str = Query(..., description="Column name to analyse"),
    bins: int = Query(20, ge=5, le=100, description="Number of histogram bins"),
):
    """Return histogram data for a specific column (numeric or categorical)."""
    try:
        return {"success": True, "data": eda.column_distribution(column, bins)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/eda/outliers", tags=["EDA"])
def eda_outliers():
    """Detect outliers using the IQR method across all numeric columns."""
    try:
        return {"success": True, "data": eda.detect_outliers()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard", tags=["Dashboard"])
def dashboard():
    """
    Return all KPI data for the main dashboard:
    KPI cards, revenue trend, sales by region, customer segmentation, monthly trend.
    """
    try:
        return {"success": True, "data": eda.dashboard_kpis()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── ML Predictions ───────────────────────────────────────────────────────────
@app.post("/api/predict", tags=["ML"])
def predict(
    target_col: str = Query(..., description="Target column to predict"),
    feature_col: str = Query(None, description="Feature column (optional; uses row index if omitted)"),
):
    """
    Run Linear Regression on the loaded dataset.
    Returns actual vs predicted chart data, R², MAE, RMSE, and 30-day forecast.
    """
    try:
        result = ml.run_regression(target_col=target_col, feature_col=feature_col)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predict/columns", tags=["ML"])
def predict_columns():
    """Return list of numeric columns available for prediction."""
    return {"success": True, "data": {"columns": ml.available_numeric_columns()}}


# ─── Report Generation ────────────────────────────────────────────────────────
@app.get("/api/report/generate", tags=["Report"])
def generate_report():
    """
    Generate and stream a branded PDF analytics report.
    Includes dataset info, EDA stats, correlation highlights, outlier summary, and insights.
    """
    try:
        pdf_bytes = rg.generate_pdf()
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="IntelliDash_Report.pdf"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=traceback.format_exc())


# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
