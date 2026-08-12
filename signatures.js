"use strict";

// Domains known to run mandatory-wait ad/interstitial or link-shortening
// pages. This is a heuristic allow-for-labeling list only - it is never used
// to bypass anything, only to *label* a hop as "advertisement" in the chain
// the user already legitimately followed via normal HTTP redirects.
const AD_INTERSTITIAL_DOMAINS = new Set([
  "adf.ly",
  "linkvertise.com",
  "link-to.net",
  "exe.io",
  "exeloader.io",
  "ouo.io",
  "shorte.st",
  "adfoc.us",
  "sub2unlock.com",
  "sub2unlock.net",
  "boost.ink",
  "loot-link.com",
  "linkpays.in",
  "gyanilinks.com",
]);

// Common generic URL shorteners - these are "redirect" hops, not
// necessarily ads, but are still an intermediate hop worth labeling.
const SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "is.gd",
  "rebrand.ly",
  "cutt.ly",
]);

// Known tracking/analytics redirect infrastructure - labeled "tracking".
const TRACKING_DOMAINS = new Set([
  "googleadservices.com",
  "doubleclick.net",
  "google.com/aclk",
  "facebook.com/l.php",
  "l.facebook.com",
  "click.linksynergy.com",
  "clickserve.dartsearch.net",
]);

// Query parameters that carry no meaning for the destination content and
// exist purely to track the click/referrer - safe to strip cosmetically
// from the URL we *display*, without altering where the request actually went.
const TRACKING_PARAM_PATTERNS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^gclsrc$/i,
  /^dclid$/i,
  /^msclkid$/i,
  /^mc_eid$/i,
  /^mc_cid$/i,
  /^ref$/i,
  /^ref_src$/i,
  /^igshid$/i,
  /^si$/i,
  /^spm$/i,
  /^_ga$/i,
  /^vero_id$/i,
  /^yclid$/i,
];

function classifyHop(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (AD_INTERSTITIAL_DOMAINS.has(host)) return "advertisement";
  if (TRACKING_DOMAINS.has(host)) return "tracking";
  if (SHORTENER_DOMAINS.has(host)) return "redirect";
  return "redirect";
}

function stripTrackingParams(urlObj) {
  let removed = 0;
  const keysToDelete = [];
  for (const key of urlObj.searchParams.keys()) {
    if (TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key))) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    urlObj.searchParams.delete(key);
    removed += 1;
  }
  return removed;
}

module.exports = {
  AD_INTERSTITIAL_DOMAINS,
  SHORTENER_DOMAINS,
  TRACKING_DOMAINS,
  classifyHop,
  stripTrackingParams,
};
