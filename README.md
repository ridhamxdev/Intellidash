# IntelliDash — AI-Powered Business Analytics Platform

<div align="center">

![IntelliDash](https://img.shields.io/badge/IntelliDash-v1.0.0-6366f1?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![Deployed](https://img.shields.io/badge/Live-Vercel%20%2B%20Render-black?style=for-the-badge)

**🔗 Live Demo: [intellidash-ten.vercel.app](https://intellidash-ten.vercel.app)**

</div>

---

## About the Project

IntelliDash is a full-stack, enterprise-grade interactive data analytics platform built as a final year B.E. Computer Science & Design project, based on a real internship at **Rooman Technologies** as a Data Analytics Intern.

The platform allows users to upload any CSV or Excel dataset and instantly get a complete analytical view — from raw data exploration to machine learning forecasts and downloadable PDF reports. It is designed to look and function like a real enterprise product, not a student project.

| Field | Details |
|---|---|
| **Student** | Aryan Chandak (1DT22CG007) |
| **College** | Dayananda Sagar Academy of Technology and Management (DSATM), Bengaluru |
| **University** | Visvesvaraya Technological University (VTU) |
| **Internship** | Data Analytics Intern — Rooman Technologies, Bengaluru |
| **Internship Period** | February 2026 – May 2026 |

---

## What Problem Does It Solve?

In most organisations, raw data sits in spreadsheets with no easy way to explore it, visualise trends, or make predictions without expensive BI tools like Tableau or Power BI. IntelliDash solves this by providing:

- A **free, open-source** alternative that works with any CSV or Excel file
- **Instant EDA** — no coding required, just upload and explore
- **ML forecasting** built in — predict any numeric column with one click
- **PDF reports** that can be shared with stakeholders immediately

---

## Key Features

### 1. File Upload & Auto-Detection
Upload any CSV or Excel file (up to 50 MB). The system automatically detects column types (numeric, categorical, date), calculates missing value percentages, duplicate counts, and assigns a **Data Quality Score (0–100)**.

### 2. Data Preprocessing Panel
Choose how to handle missing values:
- **Mean / Median / Mode imputation** for numeric columns
- **Drop rows** with nulls
- **Remove duplicate rows** with a toggle

Before and after quality scores are shown with a visual progress bar. A missing value heatmap shows which columns are affected.

### 3. Exploratory Data Analysis (EDA) Engine
Five analysis tabs:
- **Summary Statistics** — mean, median, std dev, min, max, Q1, Q3, skewness, kurtosis for every numeric column. Top value counts for categorical columns.
- **Correlation Heatmap** — Pearson correlation matrix rendered as an interactive SVG heatmap. Top correlated pairs ranked by strength.
- **Distribution** — Histogram for any numeric column, value count bar chart for categorical columns. Select any column from a dropdown.
- **Outlier Detection** — IQR method applied to all numeric columns. Shows lower/upper fences, outlier count, outlier percentage, and a sample of outlier rows.
- **Preprocessing** — Run data cleaning directly from the EDA page and see the cleaned data preview.

### 4. Interactive Dashboard (KPI Overview)
Four KPI cards at the top:
- Total Records
- Numeric Columns
- Missing Data %
- Data Quality Score

Four interactive charts:
- **Revenue Over Time** — Weekly aggregated line chart with a brush/zoom control
- **Sales by Region** — Coloured bar chart
- **Customer Segmentation** — Donut pie chart with percentage labels
- **Monthly Trend** — Dual area chart (total revenue + average revenue)

All charts have hover tooltips. The revenue line chart has a date range brush for zooming.

### 5. ML Predictions Module
Select any numeric column as the target. Optionally select a feature column (or use row index as a time proxy). The system:
- Splits data 80/20 (train/test)
- Applies StandardScaler normalisation
- Fits a **Linear Regression** model
- Returns **R² score, MAE, RMSE, MAPE**
- Shows an **Actual vs Predicted** line chart
- Generates a **30-day forecast** with 95% confidence interval shading

### 6. PDF Report Export
One-click export of a branded PDF report containing:
- Student and internship details
- Dataset overview (shape, types, quality score)
- Full summary statistics table
- Categorical column insights
- Top correlation pairs
- Outlier detection summary
- Monthly revenue breakdown
- AI-generated key insights and recommendations

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework — async, fast, auto-generates OpenAPI docs |
| **Pandas** | Data ingestion, preprocessing, EDA computations |
| **NumPy** | Numerical operations, IQR calculations |
| **Scikit-learn** | Linear Regression, StandardScaler, train/test split, metrics |
| **ReportLab** | Programmatic PDF generation with custom branding |
| **Uvicorn** | ASGI server for production deployment |
| **Python-multipart** | Multipart file upload handling |
| **OpenPyXL** | Excel (.xlsx) file reading |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework — functional components, hooks, Context API |
| **Vite** | Build tool — fast HMR in dev, optimised production builds |
| **Recharts** | Interactive charts (LineChart, BarChart, PieChart, AreaChart) |
| **Tailwind CSS** | Utility-first dark-theme styling |
| **Axios** | HTTP client with request/response interceptors |
| **React Router v6** | Client-side navigation between pages |
| **Lucide React** | Icon library |

### Deployment
| Service | Role |
|---|---|
| **Render** | Backend hosting (Python web service, free tier) |
| **Vercel** | Frontend hosting (Vite/React, free tier) |
| **GitHub** | Source control — monorepo (`ridhamxdev/Intellidash`) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│              React 18 + Vite (Vercel)                   │
│  Dashboard │ Upload │ EDA │ Predictions │ Report         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Axios)
                       │ VITE_API_URL → Render
                       ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Render)                    │
│         https://intellidash.onrender.com                │
│                                                         │
│  /api/upload      /api/sample      /api/preprocess      │
│  /api/dashboard   /api/eda/*       /api/predict         │
│  /api/report/generate                                   │
│                                                         │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │data_processor│  │eda_engine  │  │   ml_engine      │ │
│  │  (Pandas)   │  │ (Pandas +  │  │ (Scikit-learn)   │ │
│  │             │  │  NumPy)    │  │                  │ │
│  └─────────────┘  └────────────┘  └──────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         report_generator (ReportLab)             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  In-memory dataset store (single session)               │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
intellidash/
├── backend/
│   ├── main.py                  # FastAPI app — 13 API endpoints
│   ├── data_processor.py        # File ingestion, quality scoring, preprocessing
│   ├── eda_engine.py            # EDA: stats, correlation, distribution, outliers, KPIs
│   ├── ml_engine.py             # Linear Regression + 30-day forecast + confidence interval
│   ├── report_generator.py      # Branded PDF with ReportLab
│   ├── requirements.txt         # Python dependencies
│   ├── render.yaml              # Render deployment config
│   ├── vercel.json              # Vercel deployment config (alternative)
│   └── sample_data/
│       └── sales_data.csv       # Built-in 500-row sample dataset
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root — React Router + DataContext (global state)
│   │   ├── index.css            # Tailwind base + custom component classes
│   │   ├── main.jsx             # React DOM entry point
│   │   ├── api/
│   │   │   └── axios.js         # Axios instance + all API helper functions
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Collapsible navigation sidebar
│   │   │   ├── KPICard.jsx      # Reusable metric card with loading skeleton
│   │   │   ├── ChartPanel.jsx   # All Recharts chart components
│   │   │   ├── DataTable.jsx    # Paginated data table
│   │   │   └── FileUpload.jsx   # Drag-and-drop file upload zone
│   │   └── pages/
│   │       ├── Dashboard.jsx    # KPI cards + 4 charts
│   │       ├── Upload.jsx       # File upload + dataset summary
│   │       ├── EDA.jsx          # 5-tab EDA interface
│   │       ├── Predictions.jsx  # ML model config + results
│   │       └── Report.jsx       # PDF export page
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json              # Vercel frontend config
├── sample_datasets/             # Additional sample CSVs for testing
│   ├── ecommerce_sales.csv      # 500 rows — e-commerce with seasonal trends
│   ├── hr_attrition.csv         # 400 rows — HR data with attrition labels
│   └── retail_store_performance.csv  # 450 rows — multi-store retail metrics
├── .gitignore
├── DEPLOYMENT.md                # Step-by-step deployment guide
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root health check |
| `GET` | `/api/health` | Service health status |
| `POST` | `/api/upload` | Upload CSV or Excel file |
| `GET` | `/api/sample` | Load built-in sales_data.csv |
| `GET` | `/api/preview` | Paginated dataset preview |
| `POST` | `/api/preprocess` | Clean data — impute or drop nulls |
| `GET` | `/api/dashboard` | All KPI + chart data for dashboard |
| `GET` | `/api/eda/summary` | Summary statistics (numeric + categorical) |
| `GET` | `/api/eda/correlation` | Pearson correlation matrix + top pairs |
| `GET` | `/api/eda/distribution` | Histogram data for a selected column |
| `GET` | `/api/eda/outliers` | IQR outlier detection across all numeric cols |
| `POST` | `/api/predict` | Run Linear Regression + 30-day forecast |
| `GET` | `/api/predict/columns` | List of numeric columns available |
| `GET` | `/api/report/generate` | Stream branded PDF report |

Interactive API docs available at: `https://intellidash.onrender.com/docs`

---

## Sample Datasets

Three ready-to-upload datasets are included in `sample_datasets/`:

### `ecommerce_sales.csv` — 500 rows
E-commerce transactions across 5 regions, 7 products, 5 categories. Includes seasonal revenue trends, discount rates, and customer segments. Best for showcasing the Dashboard and Revenue Trend charts.

### `hr_attrition.csv` — 400 rows
HR employee data with salary, performance scores, job satisfaction, and attrition labels. Strong correlations between salary/experience make this ideal for the Correlation Heatmap and ML Predictions (predict salary from experience).

### `retail_store_performance.csv` — 450 rows
Daily performance data for 8 Indian city stores across 2023–2024. Includes footfall, conversion rates, basket values, and net profit. Good for outlier detection (stores with negative profit) and regional comparisons.

---

## Local Development Setup

### Prerequisites
- Python 3.10+ — [python.org](https://python.org)
- Node.js 18+ — [nodejs.org](https://nodejs.org)

### Backend

```bash
cd intellidash/backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd intellidash/frontend

npm install
npm run dev
```

App available at `http://localhost:3000`

The Vite dev proxy automatically forwards `/api/*` requests to `localhost:8000` — no environment variables needed locally.

### First Launch

1. Open `http://localhost:3000`
2. Click **"Load Sample Dataset"** on the Dashboard
3. All charts populate immediately
4. Explore: Dashboard → Upload → EDA → Predictions → Report

---

## Deployment

| Service | URL |
|---|---|
| **Frontend (Vercel)** | https://intellidash-ten.vercel.app |
| **Backend (Render)** | https://intellidash.onrender.com |
| **API Docs** | https://intellidash.onrender.com/docs |

For full deployment instructions see [DEPLOYMENT.md](./DEPLOYMENT.md).

> **Note:** The Render free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up. Subsequent requests are fast.

---

## Design System

The UI follows a dark enterprise theme inspired by tools like Vercel Dashboard and Linear.

| Token | Value | Usage |
|---|---|---|
| Background | `#0f172a` | Page background |
| Card | `#1e293b` | Card surfaces |
| Border | `#334155` | Dividers, input borders |
| Accent | `#6366f1` | Primary actions, active states |
| Success | `#22c55e` | Positive metrics, quality scores |
| Warning | `#f59e0b` | Missing data, moderate alerts |
| Danger | `#ef4444` | Errors, negative values |
| Muted | `#94a3b8` | Secondary text, labels |
| Font | Inter | All text |

---

## Internship Context

This project was built as the capstone deliverable for the **Data Analytics Internship at Rooman Technologies, Bengaluru** (February 2026 – May 2026).

During the internship, the following skills were applied:
- **Data wrangling** with Pandas — handling real-world messy datasets
- **Exploratory Data Analysis** — identifying patterns, outliers, and correlations
- **Statistical analysis** — descriptive statistics, distribution analysis
- **Machine learning** — regression modelling, model evaluation metrics
- **Data visualisation** — translating raw numbers into actionable charts
- **Full-stack development** — building a production-ready web application end-to-end

---

## Acknowledgements

- Internship mentors at **Rooman Technologies** for guidance on real-world data analytics workflows
- **DSATM, Bengaluru** and **VTU** for academic support
- Open-source libraries: FastAPI, React, Recharts, Tailwind CSS, Scikit-learn, ReportLab

---

<div align="center">

**IntelliDash v1.0.0**  
Built with FastAPI + React · Deployed on Render + Vercel  
Aryan Chandak · 1DT22CG007 · DSATM, Bengaluru · VTU

</div>
