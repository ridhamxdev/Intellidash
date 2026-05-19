# IntelliDash — Deployment Guide

Backend → **Render** (free tier)  
Frontend → **Vercel** (free tier)

---

## Overview

```
GitHub repo 1: intellidash-backend  →  Render Web Service
GitHub repo 2: intellidash-frontend →  Vercel
```

Both repos are already committed and ready to push.

---

## Step 1 — Push to GitHub

### Backend repo

1. Go to [github.com/new](https://github.com/new)
2. Create a **new empty repo** named `intellidash-backend` (no README, no .gitignore)
3. Run these commands:

```bash
cd intellidash/backend
git remote add origin https://github.com/YOUR_USERNAME/intellidash-backend.git
git branch -M main
git push -u origin main
```

### Frontend repo

1. Go to [github.com/new](https://github.com/new)
2. Create a **new empty repo** named `intellidash-frontend` (no README, no .gitignore)
3. Run these commands:

```bash
cd intellidash/frontend
git remote add origin https://github.com/YOUR_USERNAME/intellidash-frontend.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub account and select `intellidash-backend`
3. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `intellidash-backend` |
| **Region** | Singapore (closest to India) |
| **Branch** | `main` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

4. Click **Create Web Service**
5. Wait for the first deploy to finish (~3–5 min)
6. Copy your backend URL — it will look like:
   ```
   https://intellidash-backend.onrender.com
   ```
7. Test it: open `https://intellidash-backend.onrender.com/api/health` in your browser — you should see `{"status":"healthy"}`

> **Note:** Free Render services spin down after 15 min of inactivity. The first request after sleep takes ~30 seconds. This is normal on the free plan.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import `intellidash-frontend` from GitHub
3. Vercel auto-detects Vite. Confirm these settings:

| Field | Value |
|---|---|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

4. **Before clicking Deploy**, add the environment variable:
   - Click **Environment Variables**
   - Add: `VITE_API_URL` = `https://intellidash-backend.onrender.com`
     *(use your actual Render URL from Step 2)*

5. Click **Deploy**
6. Wait ~1–2 min. Your app will be live at:
   ```
   https://intellidash-frontend.vercel.app
   ```

---

## Step 4 — Wire CORS (Backend → Frontend URL)

After Vercel gives you the frontend URL, go back to Render:

1. Open your `intellidash-backend` service
2. Go to **Environment** tab
3. Add environment variable:
   - Key: `FRONTEND_URL`
   - Value: `https://intellidash-frontend.vercel.app` *(your actual Vercel URL)*
4. Click **Save Changes** — Render will auto-redeploy

This allows the backend to accept requests from your Vercel domain.

---

## Step 5 — Verify Everything Works

1. Open your Vercel URL in the browser
2. Click **"Load Sample Dataset"** on the Dashboard page
3. All charts should populate
4. Navigate through Upload → EDA → Predictions → Report
5. Try downloading the PDF report

---

## Environment Variables Summary

### Render (Backend)
| Variable | Value | Where to set |
|---|---|---|
| `FRONTEND_URL` | `https://your-app.vercel.app` | Render → Environment tab |

### Vercel (Frontend)
| Variable | Value | Where to set |
|---|---|---|
| `VITE_API_URL` | `https://intellidash-backend.onrender.com` | Vercel → Project Settings → Environment Variables |

---

## Custom Domain (Optional)

### Vercel custom domain
1. Vercel → Project → Settings → Domains
2. Add your domain and follow DNS instructions

### After adding custom domain
Update `FRONTEND_URL` in Render to your custom domain.

---

## Troubleshooting

**CORS error in browser console**
- Make sure `FRONTEND_URL` in Render exactly matches your Vercel URL (no trailing slash)
- Redeploy the backend after setting the env var

**"No dataset loaded" after page refresh**
- Expected behaviour — the backend uses in-memory storage (no database). Click "Load Sample Dataset" again.
- This is a known limitation of the free architecture. For persistence, a database would be needed.

**Render service is slow on first load**
- Free tier spins down after inactivity. First request takes ~30s to wake up. Subsequent requests are fast.

**Vercel build fails**
- Check that `VITE_API_URL` is set in Vercel environment variables
- Make sure it does NOT have a trailing slash: ✅ `https://...onrender.com` ❌ `https://...onrender.com/`

**PDF report download fails**
- Make sure you've loaded a dataset first (click "Load Sample Dataset")
- Check browser console for CORS errors

---

## Local Development (unchanged)

```bash
# Terminal 1 — Backend
cd intellidash/backend
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd intellidash/frontend
npm run dev
# Opens at http://localhost:3000
# Vite proxy forwards /api → localhost:8000 automatically
```

No `.env` file needed locally — the proxy handles API routing.

---

*IntelliDash v1.0.0 — Aryan Chandak | 1DT22CG007 | DSATM, Bengaluru*
