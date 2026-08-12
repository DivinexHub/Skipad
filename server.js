"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { resolveUrl } = require("./resolver");

const PORT = process.env.PORT || 4000;
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "16kb" }));

// ---- In-memory stats (swap for a real DB in production) ----
const stats = {
  totalRequests: 0,
  successful: 0,
  failed: 0,
  totalProcessingTimeMs: 0,
  domainCounts: new Map(),
  errorCounts: new Map(),
  rateLimited: 0,
};
const recentHistory = []; // last 25 successful resolutions (no query params retained)
const MAX_HISTORY = 25;

function recordError(code) {
  stats.errorCounts.set(code, (stats.errorCounts.get(code) || 0) + 1);
}

function recordDomain(hostname) {
  stats.domainCounts.set(hostname, (stats.domainCounts.get(hostname) || 0) + 1);
}

// ---- Rate limiting ----
const resolveLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    stats.rateLimited += 1;
    res.status(429).json({
      success: false,
      error: "RATE_LIMITED",
      message: "Too many requests. Please wait a moment and try again.",
    });
  },
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

const ERROR_MESSAGES = {
  INVALID_URL: "That doesn't look like a valid URL.",
  UNSUPPORTED_PROTOCOL: "Only http:// and https:// links are supported.",
  BLOCKED_PRIVATE_ADDRESS: "That address points to a private or internal network and can't be processed.",
  DNS_RESOLUTION_FAILED: "The domain could not be resolved.",
  TIMEOUT: "The destination took too long to respond.",
  TOO_MANY_REDIRECTS: "Too many redirects were followed without reaching a destination.",
  REDIRECT_LOOP: "A redirect loop was detected.",
  DESTINATION_UNAVAILABLE:
    "Unable to determine the final destination. The site may require JavaScript, authentication, a CAPTCHA, or other interaction we don't attempt to bypass.",
  CAPTCHA_REQUIRED: "The destination is protected by a CAPTCHA or anti-bot system, which this tool will not attempt to defeat.",
  AUTH_REQUIRED: "The destination requires authentication, which this tool will not attempt to bypass.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  SERVER_ERROR: "Something went wrong while processing that URL.",
};

app.post("/api/resolve", resolveLimiter, async (req, res) => {
  const startedAt = Date.now();
  stats.totalRequests += 1;

  const { url } = req.body || {};

  try {
    const result = await resolveUrl(url);
    stats.successful += 1;
    stats.totalProcessingTimeMs += result.processingTimeMs;

    try {
      const host = new URL(result.finalUrl).hostname;
      recordDomain(host);
    } catch {
      /* ignore */
    }

    recentHistory.unshift({
      originalUrl: url,
      finalUrl: result.finalUrl,
      redirectCount: result.redirectCount,
      removedTracking: result.removedTracking,
      timestamp: new Date().toISOString(),
    });
    if (recentHistory.length > MAX_HISTORY) recentHistory.pop();

    res.json({
      success: true,
      originalUrl: url,
      finalUrl: result.finalUrl,
      redirectCount: result.redirectCount,
      removedTracking: result.removedTracking,
      removedTrackingCount: result.removedTrackingCount,
      chain: result.chain,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (err) {
    const code = err.code || "SERVER_ERROR";
    stats.failed += 1;
    stats.totalProcessingTimeMs += Date.now() - startedAt;
    recordError(code);

    const status =
      code === "INVALID_URL" || code === "UNSUPPORTED_PROTOCOL"
        ? 400
        : code === "BLOCKED_PRIVATE_ADDRESS"
        ? 403
        : code === "TIMEOUT"
        ? 504
        : 422;

    res.status(status).json({
      success: false,
      error: code,
      message: ERROR_MESSAGES[code] || ERROR_MESSAGES.SERVER_ERROR,
    });
  }
});

app.get("/api/history", (req, res) => {
  res.json({ success: true, history: recentHistory });
});

// ---- Admin dashboard stats ----
app.get("/api/admin/stats", (req, res) => {
  const total = stats.totalRequests || 1;
  const topDomains = [...stats.domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  const errorBreakdown = [...stats.errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }));

  res.json({
    success: true,
    totalRequests: stats.totalRequests,
    successful: stats.successful,
    failed: stats.failed,
    successRate: Number(((stats.successful / total) * 100).toFixed(1)),
    averageProcessingTimeMs: stats.totalRequests
      ? Math.round(stats.totalProcessingTimeMs / stats.totalRequests)
      : 0,
    topDomains,
    errorBreakdown,
    rateLimited: stats.rateLimited,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "NOT_FOUND" });
});

app.listen(PORT, () => {
  console.log(`SkipAd backend listening on port ${PORT}`);
});
