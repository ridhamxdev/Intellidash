# IntelliDash — AI-Powered Business Analytics Platform

**Final Year B.E. Computer Science & Design Project**

| Field | Details |
|---|---|
| Student | Aryan Chandak (1DT22CG007) |
| College | DSATM, Bengaluru |
| University | VTU |
| Internship | Data Analytics Intern, Rooman Technologies (Feb 2026 – May 2026) |

---

## Project Overview

IntelliDash is an enterprise-grade interactive data analytics dashboard that enables:

- **File Upload** — CSV/Excel ingestion with auto-detection of column types
- **Data Preprocessing** — Missing value imputation (mean/median/mode/drop), duplicate removal, quality scoring
- **EDA Engine** — Summary statistics, correlation heatmap, distribution histograms, IQR outlier detection
- **Interactive Dashboard** — KPI cards, revenue trends, regional sales, customer segmentation, monthly trends
- **ML Predictions** — Linear Regression with R², MAE, RMSE metrics and 30-day forecast with confidence intervals
- **PDF Report Export** — Branded report with all insights, statistics, and recommendations

---

## Tech Stack

### Backend (Python)
- **FastAPI** — REST API framework
- **Pandas + NumPy** — Data processing and EDA
- **Scikit-learn** — ML models (Linear Regression)
- **ReportLab** — PDF generation
- **Uvicorn** — ASGI server

### Frontend (React)
- **React 18** — Functional components with hooks
- **Recharts** — Interactive charts (Line, Bar, Pie, Area)
- **Tailwind CSS** — Dark-theme styling
- **Axios** — API communication
- **React Router v6** — Client-side navigation
- **Lucide React** — Icons

---

## Project Structure

```
intellidash/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── data_processor.py    # File ingestion, preprocessing, quality scoring
│   ├── eda_engine.py        # EDA: stats, correlation, distribution, outliers
│   ├── ml_engine.py         # Linear Regression, forecasting
│   ├── report_generator.py  # PDF export with ReportLab
│   ├── requirements.txt
│   └── sample_data/
│       └── sales_data.csv   # 500-row pre-generated dataset
└── frontend/
    ├── src/
    │   ├── App.jsx           # Root component + DataContext
    │   ├── api/axios.js      # Axios instance + API helpers
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── KPICard.jsx
    │   │   ├── ChartPanel.jsx
    │   │   ├── DataTable.jsx
    │   │   └── FileUpload.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Upload.jsx
    │       ├── EDA.jsx
    │       ├── Predictions.jsx
    │       └── Report.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Setup & Run Instructions

### Prerequisites

- **Python 3.10+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **pip** (comes with Python)

---

### Step 1 — Backend Setup

```bash
cd intellidash/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --port 8000
```

The API will be available at: **http://localhost:8000**

Interactive API docs: **http://localhost:8000/docs**

---

### Step 2 — Frontend Setup

Open a **new terminal**:

```bash
cd intellidash/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dashboard will open at: **http://localhost:3000**

---

### Step 3 — First Launch

1. Open **http://localhost:3000** in your browser
2. Click **"Load Sample Dataset"** on the Dashboard page
3. The dashboard will immediately populate with charts and KPIs
4. Navigate through all pages: Dashboard → Upload → EDA → Predictions → Report

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload CSV/Excel file |
| GET | `/api/sample` | Load sample dataset |
| GET | `/api/preview` | Paginated data preview |
| POST | `/api/preprocess` | Clean data (impute/drop) |
| GET | `/api/dashboard` | All KPI + chart data |
| GET | `/api/eda/summary` | Summary statistics |
| GET | `/api/eda/correlation` | Correlation matrix |
| GET | `/api/eda/distribution` | Column histogram |
| GET | `/api/eda/outliers` | IQR outlier detection |
| POST | `/api/predict` | Run Linear Regression |
| GET | `/api/predict/columns` | Available numeric columns |
| GET | `/api/report/generate` | Download PDF report |

---

## Sample Dataset

`sales_data.csv` — 500 rows, Jan–Dec 2024

| Column | Type | Description |
|--------|------|-------------|
| Date | date | Daily records (2024) |
| Region | categorical | North, South, East, West, International |
| Product | categorical | Product A through E |
| Customer_Segment | categorical | Premium, Standard, Basic |
| Revenue | float | Seasonal revenue with realistic variation |
| Units_Sold | int | Units per transaction |
| Profit | float | 15–40% margin |
| Customer_ID | int | Unique customer identifier |

---

## Design System

| Token | Value |
|-------|-------|
| Background | `#0f172a` |
| Card | `#1e293b` |
| Border | `#334155` |
| Accent | `#6366f1` (Indigo) |
| Success | `#22c55e` |
| Warning | `#f59e0b` |
| Danger | `#ef4444` |
| Font | Inter |

---

## Acknowledgements

This project was developed as part of the Data Analytics internship at **Rooman Technologies, Bengaluru** (Feb 2026 – May 2026), under the guidance of the internship mentors.

---

*IntelliDash v1.0.0 — Built with FastAPI + React*
