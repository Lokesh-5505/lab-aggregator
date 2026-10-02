# Lab Aggregator (MERN)

A full-stack web application that allows patients and caregivers to search for diagnostic lab tests and health packages by test name and 6-digit pincode, ranking every serving provider by the **true lowest price** (`offer_price + (home_collection ? home_collection_fee : 0)`).

---

## 1. Overview & Architecture

### The Problem
Lab prices are scattered across providers, and the advertised sticker price often conceals extra costs like home collection fees. Furthermore, comprehensive health packages that include the searched test can actually be cheaper than standalone tests, but patients rarely see them compared side-by-side.

### The Solution
Lab Aggregator unifies test and package discovery into a single search:
1. **Pincode Filtering:** Only displays providers serving the user's specific 6-digit pincode.
2. **Package-Aware Search:** Matches the search query against both standalone tests and packages containing that test.
3. **True Lowest Price Ranking:** Automatically adds the home collection fee (when applicable) to the offer price and sorts options by the real final cost.

### Why MERN?
- **Unified Language (JavaScript):** JavaScript across frontend and backend simplifies development and data structures.
- **JSON-Native Storage:** MongoDB's document model naturally accommodates nested pricing, logistics flags, and multi-value pincode and test arrays.
- **High-Performance Aggregation:** A single MongoDB aggregation pipeline handles multikey filtering, regex search, computed cost fields, and multi-key tie-breaker sorting in sub-millisecond execution times.

---

## 2. Tech Stack

- **Frontend:** React 18, Vite, Vanilla CSS Design System (no heavy frameworks, custom CSS tokens, fully responsive from 360px to 1440px+).
- **Backend:** Node.js v24+, Express.js 4.x.
- **Database:** MongoDB & Mongoose 8.x (Dual-mode: connects to MongoDB Atlas or local daemon, with automatic in-memory fallback for instant zero-configuration local runs).
- **Tooling:** Native Windows PowerShell support (`npm.cmd` / `npx.cmd`).

---

## 3. Directory Structure

```
lab-aggregator/
├── .gitignore                            # Ignores dependencies, .env, and local tools
├── prd.md                                # Full Product Requirements Document
├── README.md                             # Project documentation
├── package.json                          # Monorepo runner scripts
├── render.yaml                           # Render Blueprint deployment config
├── scripts/
│   └── dev.js                            # Concurrently starts backend & frontend
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   ├── src/
│   │   ├── index.js                      # Express app setup & CORS configuration
│   │   ├── config/db.js                  # MongoDB connection with memory fallback
│   │   ├── models/LabItem.js             # Mongoose schema with multikey indexes
│   │   ├── routes/search.js              # /api/search & /api/health routes
│   │   └── controllers/searchController.js # Validation, sanitization & aggregation pipeline
│   ├── seed/
│   │   ├── labItems.json                 # Seed dataset
│   │   └── seed.js                       # Seeding CLI script (npm run seed)
│   └── test-runner.js                    # Automated test suite for PRD acceptance cases
└── client/
    ├── package.json
    ├── .env.example
    ├── .env
    ├── vercel.json                       # Vercel SPA routing rewrites
    ├── index.html                        # SEO meta tags, Google Fonts (Outfit & Inter)
    ├── vite.config.js                    # Vite configuration with API proxy
    └── src/
        ├── main.jsx                      # React DOM mount
        ├── App.jsx                       # Main container and search state coordinator
        ├── api.js                        # Fetch client with AbortController
        ├── styles.css                    # Design system tokens, responsive cards & states
        └── components/
            ├── Header.jsx                # Brand navigation & transparency banner
            ├── SearchForm.jsx            # Test & pincode inputs + popular test chips
            ├── ResultCard.jsx            # Pricing breakdown, NABL badge, TAT, package tags
            ├── ResultsList.jsx           # Cards grid and sort summary
            ├── StatusMessage.jsx         # Skeletons, empty state, and error handling
            └── Icons.jsx                 # Custom medical SVG icons
```

---

## 4. Local Setup & Quickstart

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd lab-aggregator

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

*(On Windows PowerShell, use `npm.cmd` if PowerShell execution policy restricts `.ps1` scripts).*

### 2. Environment Configuration

The repository includes pre-configured `.env` files in both `server/` and `client/`:

**`server/.env`**:
```env
PORT=5000
MONGODB_URI=
CLIENT_ORIGIN=http://localhost:5173
```
> *Note:* If `MONGODB_URI` is left blank, the server automatically starts an in-memory MongoDB instance with pre-seeded data, allowing immediate execution without installing or configuring MongoDB! To use MongoDB Atlas, simply provide your connection string in `MONGODB_URI`.

**`client/.env`**:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Seed Database

To seed or reset the database with the official lab items:

```bash
cd server
npm run seed
```

### 4. Run the Application

You can start both the backend and frontend concurrently with a single command from the project root:

```bash
npm run dev
```

This launches:
- **Express Backend:** [http://localhost:5000](http://localhost:5000)
- **Vite React Frontend:** [http://localhost:5173](http://localhost:5173)

*(Alternatively, you can run them in separate terminals with `npm run server` and `npm run client`).*

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Acceptance Testing

A dedicated test suite validates all 9 PRD acceptance criteria test cases against the live API:

```bash
cd server
npm test
```

### Test Case Verification Matrix

| # | Query | Pincode | Expected Order & Pricing | Verified Status |
|---|---|---|---|:---:|
| **1** | `Lipid Profile` | `110001` | Local City Lab (₹450) → Apollo (₹900) → Lal PathLabs (₹1650) → Tata 1mg (₹1999) | ✅ Passed |
| **2** | `Lipid Profile` | `110002` | Apollo (₹900) → Tata 1mg (₹1999) | ✅ Passed |
| **3** | `Lipid Profile` | `560034` | Lal PathLabs (₹1650) → Tata 1mg (₹1999) | ✅ Passed |
| **4** | `lipid profile` (lowercase) | `110001` | Same as Case #1 (case-insensitive search) | ✅ Passed |
| **5** | `MRI Brain` | `560034` | Local Scan Centre (₹4200, lab visit only) | ✅ Passed |
| **6** | `MRI Brain` | `110001` | Empty results array (`[]`, count: 0) | ✅ Passed |
| **7** | `HbA1c` | `110001` | Lal PathLabs (₹1650) → Tata 1mg (₹1999) (packages containing HbA1c) | ✅ Passed |
| **8** | `Lipid Profile` | `12345` | HTTP 400 Bad Request ("Pincode must be exactly 6 digits") | ✅ Passed |
| **9** | ` ` (empty) | `110001` | HTTP 400 Bad Request ("Search query is required") | ✅ Passed |

---

## 6. API Documentation

### 6.1 Search Endpoint

`GET /api/search`

#### Query Parameters
| Parameter | Type | Required | Description | Validation |
|---|---|---|---|---|
| `search_query` | String | Yes | Name of the lab test or package | Non-empty, trimmed, max 100 characters |
| `pincode` | String | Yes | 6-digit Indian postal code | Exactly 6 digits (`/^\d{6}$/`) |

#### Sample Request
```bash
curl "http://localhost:5000/api/search?search_query=Lipid%20Profile&pincode=110001"
```

#### Sample Response (`200 OK`)
```json
{
  "query": "Lipid Profile",
  "pincode": "110001",
  "count": 4,
  "results": [
    {
      "id": "102",
      "provider_name": "Local City Lab",
      "item_type": "test",
      "item_name": "Lipid Profile",
      "included_tests": ["Lipid Profile"],
      "available_pincodes": ["110001"],
      "pricing": {
        "mrp": 600,
        "offer_price": 450
      },
      "logistics": {
        "home_collection": false,
        "home_collection_fee": 0,
        "report_tat_hours": 12
      },
      "nabl_accredited": false,
      "total_final_price": 450
    },
    {
      "id": "101",
      "provider_name": "Apollo Diagnostics",
      "item_type": "test",
      "item_name": "Lipid Profile",
      "included_tests": ["Lipid Profile"],
      "available_pincodes": ["110001", "110002", "110011"],
      "pricing": {
        "mrp": 1000,
        "offer_price": 800
      },
      "logistics": {
        "home_collection": true,
        "home_collection_fee": 100,
        "report_tat_hours": 24
      },
      "nabl_accredited": true,
      "total_final_price": 900
    }
  ]
}
```

#### Error Responses
- `400 Bad Request` (Missing query):
  ```json
  { "error": "Search query is required and cannot be empty." }
  ```
- `400 Bad Request` (Invalid pincode):
  ```json
  { "error": "Pincode must be exactly 6 digits." }
  ```

### 6.2 Health Check Endpoint

`GET /api/health`

#### Sample Response (`200 OK`)
```json
{
  "status": "ok",
  "uptime": 120.45,
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

---

## 7. Business Logic & Aggregation Pipeline

The core search is executed via a single MongoDB aggregation pipeline in `server/src/controllers/searchController.js`:

```javascript
const pipeline = [
  // 1. Pincode match & package-aware test matching (case-insensitive regex)
  {
    $match: {
      available_pincodes: pincode,
      $or: [
        { item_name: { $regex: escapedQuery, $options: 'i' } },
        { included_tests: { $regex: escapedQuery, $options: 'i' } }
      ]
    }
  },
  // 2. Compute total_final_price: offer_price + home_collection_fee
  {
    $addFields: {
      total_final_price: {
        $add: [
          "$pricing.offer_price",
          {
            $cond: [
              { $and: ["$logistics.home_collection", { $gt: ["$logistics.home_collection_fee", 0] }] },
              "$logistics.home_collection_fee",
              0
            ]
          }
        ]
      }
    }
  },
  // 3. Stable sort: total_final_price ASC, TAT ASC, provider_name ASC
  {
    $sort: {
      total_final_price: 1,
      "logistics.report_tat_hours": 1,
      provider_name: 1
    }
  },
  // 4. Project clean output
  {
    $project: {
      _id: 0,
      __v: 0
    }
  }
];
```

---

## 8. Step 4: Thinking Question — Competitor Scraping Architecture

> **Question:** *In the real world, big companies will try to block our servers from scraping their prices. If you had to build a scraper to get live prices from a competitor's website without getting blocked, how would you architect it? (Briefly explain in 4-5 sentences).*

**Answer (4–5 sentences):**
> To collect live competitor prices reliably without getting blocked, I would first prioritize sanctioned integration routes like partner APIs, affiliate feeds, or public JSON endpoints that the sites already consume, falling back to scraping only for public pricing pages while strictly respecting `robots.txt`. The scraper would run as an asynchronous queue-based worker system (BullMQ + Redis) with per-domain concurrency limits, randomized jitter delays, and exponential backoff to avoid bursty spikes. Requests would be routed through rotating residential proxies with authentic browser headers, TLS fingerprinting, and session affinity, using a headless browser (Playwright) only for JavaScript-rendered SPAs and fast plain HTTP for static HTML. Scraped results would be cached in MongoDB with a 24–72 hour TTL so users are served from internal data sub-20ms without repeatedly hitting competitor servers. Finally, automated anomaly detection on block rates and DOM layout shifts would trigger alerts and gracefully fall back to the last known cached price tagged as "stale" if a competitor source becomes temporarily unreachable.

### Detailed Architecture Breakdown:

1. **Prioritize Sanctioned Integration Routes:**
   - Look first for official partner APIs, affiliate feeds, or public JSON endpoints that competitor web/mobile apps consume directly. This eliminates HTML parsing fragility and avoids anti-bot scrutiny.
   - For web scraping, strictly respect `robots.txt` directives, scrape only publicly visible catalog pages, and honor site-specific terms.

2. **Distributed Queue Worker Architecture:**
   - Implement an asynchronous job queue using **BullMQ + Redis**.
   - Decouple price discovery from user requests: schedule background crawler workers per domain with strict concurrency limits (e.g. maximum 1–2 concurrent requests per lab domain).
   - Apply randomized jitter delays (1.5s–4s) and exponential backoff on retry to avoid bursty spikes that trigger rate-limit alarms.

3. **Residential Proxy Rotation & Session Mimicry:**
   - Route outgoing crawler requests through a rotating residential proxy pool.
   - Maintain consistent proxy IP affinity per browsing session so multi-step requests (e.g. pincode entry → test listing) appear natural.
   - Emulate authentic browser TLS fingerprints (using libraries like `curl-impersonate`) and rotate modern user-agent strings, `Accept-Language`, and `Sec-CH-UA` headers.

4. **Hybrid Extraction Engine (Playwright + HTTP):**
   - Use fast, lightweight plain HTTP requests (`undici` / `cheerio`) for static server-rendered listings to preserve bandwidth and compute.
   - Fall back to headless **Playwright** only for JavaScript-heavy single-page applications (SPAs) or shadow DOM renderers. In Playwright, block third-party analytics, fonts, and heavy images to reduce request footprints.

5. **Intelligent Caching with TTL:**
   - Diagnostic test prices change infrequently (typically weekly or monthly).
   - Store scraped prices in MongoDB with a Time-To-Live (TTL) of 24–72 hours.
   - User searches are served 100% from the internal database in under 20ms, drastically minimizing live requests to external sites.

6. **Automated Anomaly Detection & Graceful Fallback:**
   - Monitor crawler health metrics: block rates, HTTP 403/429 responses, and CAPTCHA challenge frequencies.
   - Detect DOM structural changes automatically via schema validation tests.
   - When a competitor source is temporarily unreachable or blocked, serve the last known cached price with a visible `"Prices last verified on [Date]"` tag rather than failing the user's search.

---

## 9. Deployment Guide (Render + Vercel + MongoDB Atlas)

### Step 1: Database Setup (MongoDB Atlas)
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. In **Database Access**, create a database user and password.
3. In **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere) so Render can connect.
4. Click **Connect** → **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/labaggregator?retryWrites=true&w=majority
   ```
5. Paste this connection string into your local `.env` (or `server/.env`) as `MONGODB_URI`.
6. Run `npm run seed` to seed your Atlas cluster with the 5 mock items.

---

### Step 2: Backend Deployment (Render)
1. Push your repository to GitHub.
2. Log in to [Render](https://dashboard.render.com/) and click **New** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name:** `lab-aggregator-backend`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. In **Environment Variables**, add:
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
   - `CLIENT_ORIGIN`: `https://<your-vercel-app-name>.vercel.app` *(or `*` during initial testing)*
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render public URL (e.g. `https://lab-aggregator-backend.onrender.com`).
   - You can test it by visiting: `https://lab-aggregator-backend.onrender.com/api/health`

> **Note on Free Render Tier:** Free Render instances spin down after inactivity and may take 30–50 seconds to wake up on the first request.

---

### Step 3: Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `client`
   - **Build Command:** `npm run build` *(auto-detected)*
   - **Output Directory:** `dist` *(auto-detected)*
4. Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://<your-render-service-name>.onrender.com` *(your Render backend URL from Step 2)*
5. Click **Deploy**.
6. When deployment finishes, copy your live Vercel URL (e.g. `https://lab-aggregator.vercel.app`).
7. Update `CLIENT_ORIGIN` in Render's Environment Variables with your Vercel URL to secure CORS.

---

## 10. Submission Deliverables & Links

| Deliverable | Link / Status |
|---|---|
| **GitHub Repository** | `[Your GitHub Repository URL]` |
| **Live Frontend (Vercel)** | `[Your Deployed Vercel URL]` |
| **Live Backend API (Render)** | `[Your Deployed Render URL]` |
| **Loom Video (max 3 mins)** | `[Your Loom Video URL]` |

### Loom Video Recording Guide (3-Minute Script)
- **0:00 – 1:15 (Live Demo):**
  - Search `Lipid Profile` with pincode `110001`. Point out the true lowest price ranking: Local City Lab (₹450) is #1 because Apollo (₹800 + ₹100 = ₹900) includes a home collection fee.
  - Highlight the "Single Test" vs "Package" badges, strikethrough MRP, and "NABL Certified" checkmark.
  - Search `HbA1c` with pincode `110001` to show how packages containing the test appear.
  - Search `MRI Brain` with pincode `110001` to show the clean empty state.
  - Switch to responsive mobile mode (375px) to show the adaptive layout.
- **1:15 – 2:15 (Code Walkthrough):**
  - Open `server/src/controllers/searchController.js` and explain the aggregation pipeline (`$match` with regex escaping across `item_name` and `included_tests`, `$addFields` calculating `total_final_price`, and `$sort`).
  - Open `client/src/components/ResultCard.jsx` and show the fee breakdown logic.
- **2:15 – 2:50 (Why MERN?):**
  - Discuss unified JavaScript across the stack, MongoDB's document model matching the nested pricing/logistics schema, and high-performance pipeline queries.
