# SkipAd

A smart URL redirect resolver that follows the redirects a browser would
already follow, labels ad/tracking interstitials along the way, and shows
you the final destination — without bypassing logins, paywalls, CAPTCHAs,
or any other access control.

```
skipad/
├── backend/     Node.js + Express API (SSRF-safe redirect resolver)
└── frontend/    React + TypeScript + Tailwind UI
```

## What it does — and doesn't — do

- Validates the submitted URL and rejects dangerous protocols
  (`javascript:`, `data:`, `file:`, etc.).
- Resolves the hostname and blocks requests to localhost, private IP
  ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, link-local,
  etc.), re-checking the IP on **every hop** to prevent DNS-rebinding.
- Follows normal HTTP redirects (up to 8 hops, 15s total budget) and
  labels each hop as a redirect, tracking hop, ad/interstitial, or the
  final destination, based on known domain patterns.
- Strips common tracking query parameters (`utm_*`, `fbclid`, `gclid`, …)
  from the displayed final URL.
- **Never** attempts to defeat CAPTCHAs, log in, bypass paywalls, or
  execute page JavaScript. If a destination can't be determined safely,
  it says so plainly instead of guessing.

## Running locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
# listening on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no
extra configuration is needed in development. For production, build the
frontend (`npm run build`) and serve the `dist/` folder from your CDN or
static host of choice, pointing `/api` at the deployed backend.

## API

`POST /api/resolve`

```json
{ "url": "https://example.com/some-redirect-page" }
```

Success:

```json
{
  "success": true,
  "originalUrl": "https://example.com/some-redirect-page",
  "finalUrl": "https://destination.com",
  "redirectCount": 3,
  "removedTracking": true,
  "removedTrackingCount": 2,
  "chain": [ { "url": "...", "statusCode": 302, "type": "redirect" } ],
  "processingTimeMs": 1240
}
```

Failure:

```json
{ "success": false, "error": "DESTINATION_UNAVAILABLE", "message": "..." }
```

`GET /api/history` — last 25 successful resolutions (in-memory).
`GET /api/admin/stats` — aggregate usage stats for the admin dashboard.

## Production notes

- Swap the in-memory stats/history store for a real database before
  scaling past a single instance.
- The rate limiter (`express-rate-limit`) is in-memory too — back it with
  Redis for multi-instance deployments.
- Put the backend behind a reverse proxy that enforces its own network
  egress rules as defense-in-depth alongside the app-level SSRF checks.
