# PRD: Lab Aggregator (MERN)

## 1. Overview

**Lab Aggregator** is a full-stack web app where a user enters a lab test name and a pincode, then sees every available provider option (standalone tests and health packages) sorted by the **true lowest price** (offer price + home collection fee).

**Stack:** MongoDB, Express.js, React (Vite), Node.js.

**Why this stack:** One language (JavaScript) across the whole product, JSON-native storage that matches the data shape (arrays of pincodes, nested pricing/logistics), fast to build and easy to deploy.

## 2. Problem & Goal

Lab prices are scattered across providers, and the sticker price hides extra costs like home collection fees. Packages that include the searched test are often cheaper than expected but are rarely compared next to single tests.

**Goal:** Give users one search that:
1. Only shows providers that serve their pincode.
2. Shows both single tests and packages containing the searched test.
3. Ranks everything by the real total cost.

## 3. Target Users

- Patients or caregivers looking for the cheapest place to get a test done.
- Users who want to compare home collection vs. walk-in options, report turnaround time, and accreditation.

## 4. Scope

### In scope
- Seeded MongoDB collection of lab items.
- REST search endpoint with pincode filtering, package-aware search, and total-price sorting.
- Responsive React UI with search form and result cards.
- README with run instructions and architecture note.
- Optional live deployment.

### Out of scope
- Authentication, booking, payments.
- Live scraping (data comes from seeded data only).
- Admin panel / CRUD for providers.

## 5. Data Model

Collection: `labitems` (Mongoose model `LabItem`)

```json
{
  "id": "101",
  "provider_name": "Apollo Diagnostics",
  "item_type": "test",
  "item_name": "Lipid Profile",
  "included_tests": ["Lipid Profile"],
  "available_pincodes": ["110001", "110002", "110011"],
  "pricing": { "mrp": 1000, "offer_price": 800 },
  "logistics": {
    "home_collection": true,
    "home_collection_fee": 100,
    "report_tat_hours": 24
  },
  "nabl_accredited": true
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | String | Unique, indexed |
| `provider_name` | String | Required |
| `item_type` | String enum | `test` or `package` |
| `item_name` | String | Required |
| `included_tests` | [String] | Tests contained in the item (single test = itself) |
| `available_pincodes` | [String] | Indexed (multikey) |
| `pricing.mrp` / `pricing.offer_price` | Number | Required |
| `logistics.home_collection` | Boolean | |
| `logistics.home_collection_fee` | Number | `0` if free or not available |
| `logistics.report_tat_hours` | Number | |
| `nabl_accredited` | Boolean | |

### Seed Data (`server/seed/labItems.json`)

```json
[
  {
    "id": "101",
    "provider_name": "Apollo Diagnostics",
    "item_type": "test",
    "item_name": "Lipid Profile",
    "included_tests": ["Lipid Profile"],
    "available_pincodes": ["110001", "110002", "110011"],
    "pricing": { "mrp": 1000, "offer_price": 800 },
    "logistics": { "home_collection": true, "home_collection_fee": 100, "report_tat_hours": 24 },
    "nabl_accredited": true
  },
  {
    "id": "102",
    "provider_name": "Local City Lab",
    "item_type": "test",
    "item_name": "Lipid Profile",
    "included_tests": ["Lipid Profile"],
    "available_pincodes": ["110001"],
    "pricing": { "mrp": 600, "offer_price": 450 },
    "logistics": { "home_collection": false, "home_collection_fee": 0, "report_tat_hours": 12 },
    "nabl_accredited": false
  },
  {
    "id": "103",
    "provider_name": "Tata 1mg",
    "item_type": "package",
    "item_name": "Comprehensive Cardiac Care Package",
    "included_tests": ["Lipid Profile", "ECG", "Fasting Blood Sugar", "HbA1c"],
    "available_pincodes": ["110001", "110002", "560034", "560035"],
    "pricing": { "mrp": 3500, "offer_price": 1999 },
    "logistics": { "home_collection": true, "home_collection_fee": 0, "report_tat_hours": 48 },
    "nabl_accredited": true
  },
  {
    "id": "104",
    "provider_name": "Lal PathLabs",
    "item_type": "package",
    "item_name": "Basic Diabetic Package",
    "included_tests": ["Fasting Blood Sugar", "HbA1c", "Lipid Profile"],
    "available_pincodes": ["110001", "560034"],
    "pricing": { "mrp": 2200, "offer_price": 1500 },
    "logistics": { "home_collection": true, "home_collection_fee": 150, "report_tat_hours": 24 },
    "nabl_accredited": true
  },
  {
    "id": "105",
    "provider_name": "Local Scan Centre",
    "item_type": "test",
    "item_name": "MRI Brain",
    "included_tests": ["MRI Brain"],
    "available_pincodes": ["560034"],
    "pricing": { "mrp": 8000, "offer_price": 4200 },
    "logistics": { "home_collection": false, "home_collection_fee": 0, "report_tat_hours": 4 },
    "nabl_accredited": true
  }
]
```

A seed script (`npm run seed`) clears the collection and inserts this file.

## 6. Backend (Node + Express + Mongoose)

### 6.1 Endpoint

`GET /api/search?search_query=Lipid%20Profile&pincode=110001`

| Param | Required | Validation |
|---|---|---|
| `search_query` | Yes | Trimmed, non-empty, max ~100 chars |
| `pincode` | Yes | Exactly 6 digits (`/^\d{6}$/`) |

### 6.2 Business Logic

1. **Pincode filter:** keep only items where `available_pincodes` contains the requested pincode.
2. **Package-aware search:** match the query (case-insensitive, trimmed, regex-escaped) against **either** `item_name` **or** any entry in `included_tests`. This returns standalone tests and packages that contain the test.
3. **Total price:** `total_final_price = offer_price + (home_collection ? home_collection_fee : 0)`.
4. **Sort:** ascending by `total_final_price`. Tie-breakers: lower `report_tat_hours`, then `provider_name` A-Z, so results are stable.

Implementation: a single Mongo aggregation pipeline:
```
$match  { available_pincodes: pincode, $or: [ {item_name: /q/i}, {included_tests: /q/i} ] }
$addFields { total_final_price: { $add: ["$pricing.offer_price",
             { $cond: ["$logistics.home_collection", "$logistics.home_collection_fee", 0] }] } }
$sort   { total_final_price: 1, "logistics.report_tat_hours": 1, provider_name: 1 }
$project { _id: 0 }
```

### 6.3 Response

```json
{
  "query": "Lipid Profile",
  "pincode": "110001",
  "count": 4,
  "results": [
    { "id": "102", "...": "...", "total_final_price": 450 }
  ]
}
```

Errors: `400` with `{ "error": "message" }` for invalid/missing params; `500` for server errors. Empty matches return `200` with `results: []`.

### 6.4 Server Setup
- CORS enabled for the frontend origin (env-configured).
- Env vars: `PORT`, `MONGODB_URI`, `CLIENT_ORIGIN`.
- Optional: `GET /api/health` for deployment checks.
- Indexes on `available_pincodes`, `item_name`, `included_tests`.

## 7. Frontend (React + Vite)

### 7.1 Layout
- Header with app name and short tagline.
- Search form: **Test Name** input, **Pincode** input (numeric, max 6 digits), **Search** button.
- Results area below the form: result count and sorted list of cards.
- Fully mobile-responsive (single column on mobile, 2-column grid on larger screens, form stacks vertically on small screens).

### 7.2 Result Card Requirements

Each card shows:
- **Provider name** and **item name**.
- **Type badge:** "Single Test" or "Package".
- **Included tests as tags** when the item is a package (highlight the searched test).
- **MRP with strikethrough** next to the **offer price**, plus an optional "% off" label.
- **Total Final Price**, prominent, with breakdown, e.g. `₹800 + ₹100 Home Collection`.
  - Free home collection: `₹1999 + Free Home Collection`.
  - No home collection: `₹450 · Lab visit only`.
- **"NABL Certified" badge** when `nabl_accredited` is true.
- Report turnaround time (e.g. "Report in 24 hrs").
- A subtle "Lowest price" tag on the first result.

### 7.3 UI States
- **Initial:** friendly prompt to search.
- **Loading:** spinner or skeleton cards.
- **Empty:** "No labs found for this test in pincode XXXXXX."
- **Error:** readable message with retry.
- **Validation:** inline message for empty test name or a pincode that isn't 6 digits; Enter key submits.

### 7.4 Implementation Notes
- API base URL from `VITE_API_URL`.
- Components: `SearchForm`, `ResultCard`, `ResultsList`, `StatusMessage`.
- Use `fetch` or axios; disable button while loading.
- Currency formatted with `₹` and Indian number formatting (`toLocaleString("en-IN")`).

## 8. Project Structure

```
lab-aggregator/
├── prd.md
├── README.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js
│   │   ├── config/db.js
│   │   ├── models/LabItem.js
│   │   ├── routes/search.js
│   │   └── controllers/searchController.js
│   └── seed/
│       ├── labItems.json
│       └── seed.js
└── client/
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── components/ (SearchForm, ResultCard, ResultsList)
        └── styles.css
```

## 9. Acceptance Criteria (Test Cases)

| # | Search | Pincode | Expected results (in order) |
|---|---|---|---|
| 1 | Lipid Profile | 110001 | Local City Lab ₹450 → Apollo ₹900 → Lal PathLabs ₹1650 → Tata 1mg ₹1999 |
| 2 | Lipid Profile | 110002 | Apollo ₹900 → Tata 1mg ₹1999 |
| 3 | Lipid Profile | 560034 | Lal PathLabs ₹1650 → Tata 1mg ₹1999 |
| 4 | lipid profile (lowercase) | 110001 | Same as #1 |
| 5 | MRI Brain | 560034 | Local Scan Centre ₹4200 (no home collection) |
| 6 | MRI Brain | 110001 | Empty state |
| 7 | HbA1c | 110001 | Lal PathLabs ₹1650 → Tata 1mg ₹1999 (packages only) |
| 8 | Lipid Profile | 12345 | Validation error (400 / inline message) |
| 9 | (empty) | 110001 | Validation error |

Also verify: strikethrough MRP, NABL badge only on accredited items (Local City Lab has none), package tags shown, layout works at 360px width.

## 10. Non-Functional Requirements

- Search response under ~300 ms on the seeded dataset.
- Works on current Chrome, Safari, Firefox, and mobile browsers.
- Sensible input sanitization (escape regex characters in the query).
- Secrets in env files, none committed.

## 11. Deployment (Bonus)

- **Database:** MongoDB Atlas (free tier), run the seed script against it.
- **Backend:** Render (Node web service), set `MONGODB_URI` and `CLIENT_ORIGIN`.
- **Frontend:** Vercel or Netlify, set `VITE_API_URL` to the Render URL.
- Note in the README that a free Render instance may take a few seconds to wake up.

## 12. Deliverables

1. **GitHub repository** with clean commits and a `README.md` containing:
   - Project description and tech stack.
   - Local setup: prerequisites, `npm install`, env setup, `npm run seed`, starting server and client.
   - API documentation (endpoint, params, sample response).
   - Live demo links (if deployed).
   - The scraping architecture answer (Section 13).
2. **Demo video (max 3 minutes, Loom or similar)** covering:
   - The working app (a few searches, including a package match and a no-result case).
   - A short code walkthrough (search aggregation, price calculation, card component).
   - Why MERN was chosen.

## 13. README Section: Competitor Price Data Without Getting Blocked

To collect live competitor prices reliably, I would first look for sanctioned routes (partner APIs, affiliate feeds, or public JSON endpoints the sites already call) and fall back to scraping only for public pricing pages while respecting `robots.txt` and rate limits. The scraper would run as a queue-based worker system (BullMQ + Redis) with per-domain throttling, randomized delays, and exponential backoff, so no single site sees bursty traffic. Requests would go through rotating residential proxies with realistic browser headers and sessions, using a headless browser (Playwright) only for JavaScript-heavy pages and plain HTTP for everything else. Scraped results would be cached in the database with a TTL (prices rarely change minute to minute), so we hit competitor sites far less often and serve users from our own data. Finally, monitoring and alerts on block rates, CAPTCHA frequency, and layout changes would let us adapt parsers quickly and fall back to the last known price flagged as "stale" when a source is unavailable.
