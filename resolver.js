"use strict";

const http = require("http");
const https = require("https");
const {
  validateAndNormalizeUrl,
  assertHostnameIsPublic,
} = require("./urlSafety");
const { classifyHop, stripTrackingParams } = require("./signatures");

const MAX_REDIRECTS = 8;
const REQUEST_TIMEOUT_MS = 6000;
const TOTAL_BUDGET_MS = 15000;
const MAX_RESPONSE_BYTES = 512 * 1024; // only used if we ever peek at body

/**
 * Performs a single HTTP(S) HEAD (falling back to GET) request against a
 * URL whose hostname has already been resolved and verified as public.
 * The resolved IP is pinned via a custom `lookup` so the TCP connection
 * cannot be silently redirected to a different (possibly private) address
 * between our DNS check and the actual connection (DNS-rebinding defense).
 */
function requestOnce(urlObj, resolvedIp, method) {
  return new Promise((resolve, reject) => {
    const lib = urlObj.protocol === "https:" ? https : http;

    const options = {
      method,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      headers: {
        "User-Agent": "SkipAd-Resolver/1.0 (+https://skipad.example/bot)",
        Accept: "text/html,*/*",
      },
      timeout: REQUEST_TIMEOUT_MS,
      // Pin the connection to the IP we already validated as public,
      // regardless of what a fresh DNS lookup might return later.
      lookup: (_hostname, opts, cb) => {
        if (opts && opts.all) {
          cb(null, [{ address: resolvedIp, family: urlObj.protocol === "https:" ? 4 : 4 }]);
        } else {
          cb(null, resolvedIp, 4);
        }
      },
    };

    const req = lib.request(options, (res) => {
      // Drain and discard the body - we only care about status/headers.
      let received = 0;
      res.on("data", (chunk) => {
        received += chunk.length;
        if (received > MAX_RESPONSE_BYTES) {
          res.destroy();
        }
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers });
      });
      res.on("error", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("TIMEOUT"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

async function fetchStatusAndLocation(urlObj) {
  const resolvedIps = await assertHostnameIsPublic(urlObj.hostname);
  const ip = resolvedIps[0];

  let result;
  try {
    result = await requestOnce(urlObj, ip, "HEAD");
  } catch {
    // Some servers don't support HEAD - fall back to GET.
    result = await requestOnce(urlObj, ip, "GET");
  }

  // A small number of servers return 2xx/errors to HEAD but behave
  // differently on GET (e.g. 405). Retry with GET in that case too.
  if (result.statusCode === 405 || result.statusCode === 501) {
    result = await requestOnce(urlObj, ip, "GET");
  }

  return result;
}

/**
 * Follows redirects starting from `startUrl`, validating each hop against
 * SSRF rules, up to MAX_REDIRECTS. Returns the full chain plus the final
 * resolved URL (or throws a typed error if it can't safely resolve).
 */
async function resolveUrl(startUrl) {
  const startTime = Date.now();
  const initialUrlObj = validateAndNormalizeUrl(startUrl);

  const chain = [];
  const seen = new Set();
  let currentUrlObj = initialUrlObj;
  let removedTrackingCount = 0;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (Date.now() - startTime > TOTAL_BUDGET_MS) {
      throw Object.assign(new Error("TIMEOUT"), { code: "TIMEOUT" });
    }

    const key = currentUrlObj.toString();
    if (seen.has(key)) {
      throw Object.assign(new Error("REDIRECT_LOOP"), { code: "REDIRECT_LOOP" });
    }
    seen.add(key);

    let response;
    try {
      response = await fetchStatusAndLocation(currentUrlObj);
    } catch (err) {
      if (err.code === "BLOCKED_PRIVATE_ADDRESS") {
        throw Object.assign(new Error("BLOCKED_PRIVATE_ADDRESS"), {
          code: "BLOCKED_PRIVATE_ADDRESS",
        });
      }
      throw Object.assign(new Error("DESTINATION_UNAVAILABLE"), {
        code: "DESTINATION_UNAVAILABLE",
      });
    }

    const isRedirect =
      response.statusCode >= 300 &&
      response.statusCode < 400 &&
      response.headers.location;

    chain.push({
      url: sanitizeForDisplay(currentUrlObj),
      statusCode: response.statusCode,
      type: hop === 0 ? "original" : isRedirect ? classifyHop(currentUrlObj.hostname) : "final",
    });

    if (!isRedirect) {
      const removed = stripTrackingParams(currentUrlObj);
      removedTrackingCount += removed;
      chain[chain.length - 1].url = sanitizeForDisplay(currentUrlObj);
      chain[chain.length - 1].type = "final";

      return {
        finalUrl: currentUrlObj.toString(),
        redirectCount: hop,
        removedTracking: removedTrackingCount > 0,
        removedTrackingCount,
        chain,
        processingTimeMs: Date.now() - startTime,
      };
    }

    let nextUrlObj;
    try {
      nextUrlObj = new URL(response.headers.location, currentUrlObj);
    } catch {
      throw Object.assign(new Error("DESTINATION_UNAVAILABLE"), {
        code: "DESTINATION_UNAVAILABLE",
      });
    }

    if (!["http:", "https:"].includes(nextUrlObj.protocol)) {
      throw Object.assign(new Error("UNSUPPORTED_PROTOCOL"), {
        code: "UNSUPPORTED_PROTOCOL",
      });
    }

    currentUrlObj = nextUrlObj;
  }

  throw Object.assign(new Error("TOO_MANY_REDIRECTS"), {
    code: "TOO_MANY_REDIRECTS",
  });
}

/** Strips query strings from non-final hops so the UI never leaks tokens. */
function sanitizeForDisplay(urlObj) {
  const clone = new URL(urlObj.toString());
  // Keep display clean: drop query/hash for intermediate/ad/tracking hops.
  clone.search = "";
  clone.hash = "";
  return clone.toString();
}

module.exports = { resolveUrl };
