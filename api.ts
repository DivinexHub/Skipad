import type { ResolveResponse, HistoryEntry, AdminStats } from "./types";

const BASE = "/api";

export async function resolveUrl(url: string): Promise<ResolveResponse> {
  const res = await fetch(`${BASE}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return (await res.json()) as ResolveResponse;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${BASE}/history`);
  const data = await res.json();
  return data.history ?? [];
}

export async function fetchAdminStats(): Promise<AdminStats | null> {
  try {
    const res = await fetch(`${BASE}/admin/stats`);
    return (await res.json()) as AdminStats;
  } catch {
    return null;
  }
}
