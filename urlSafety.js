"use strict";

const dns = require("dns").promises;
const net = require("net");

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_URL_LENGTH = 2048;

/**
 * Checks whether an IPv4/IPv6 address falls inside a private, loopback,
 * link-local, or otherwise non-public range. Used to block SSRF attempts
 * against internal infrastructure (including DNS-rebinding attempts, since
 * we re-check the resolved IP on every hop, not just the original hostname).
 */
function isPrivateOrReservedIp(ip) {
  const version = net.isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // "this" network
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a === 192 && b === 0 && parts[2] === 0) return true; // IETF protocol assignments
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a >= 224) return true; // multicast / reserved / broadcast range
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower === "::") return true; // unspecified
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (fc00::/7)
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 address, check the embedded IPv4 part too
      const embedded = lower.replace("::ffff:", "");
      if (net.isIP(embedded) === 4) return isPrivateOrReservedIp(embedded);
    }
    return false;
  }
  return true; // not a recognizable IP - treat as unsafe
}

/**
 * Validates and normalizes a user-submitted URL. Throws a descriptive
 * error for anything that should be rejected outright.
 */
function validateAndNormalizeUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new Error("INVALID_URL");
  }
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new Error("INVALID_URL");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("INVALID_URL");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("UNSUPPORTED_PROTOCOL");
  }

  // Reject embedded credentials (user:pass@host) - common SSRF/phishing vector
  if (parsed.username || parsed.password) {
    throw new Error("INVALID_URL");
  }

  if (!parsed.hostname) {
    throw new Error("INVALID_URL");
  }

  return parsed;
}

/**
 * Resolves a hostname and verifies none of its addresses point at
 * internal/private infrastructure. Returns the list of resolved IPs.
 */
async function assertHostnameIsPublic(hostname) {
  // If the hostname is itself a raw IP literal, validate directly.
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error("BLOCKED_PRIVATE_ADDRESS");
    }
    return [hostname];
  }

  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === "localhost" ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") ||
    lowerHost.endsWith(".internal")
  ) {
    throw new Error("BLOCKED_PRIVATE_ADDRESS");
  }

  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("DNS_RESOLUTION_FAILED");
  }

  if (!records || records.length === 0) {
    throw new Error("DNS_RESOLUTION_FAILED");
  }

  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new Error("BLOCKED_PRIVATE_ADDRESS");
    }
  }

  return records.map((r) => r.address);
}

module.exports = {
  validateAndNormalizeUrl,
  assertHostnameIsPublic,
  isPrivateOrReservedIp,
  ALLOWED_PROTOCOLS,
};
