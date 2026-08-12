export type ChainHopType = "original" | "redirect" | "tracking" | "advertisement" | "final";

export interface ChainHop {
  url: string;
  statusCode: number;
  type: ChainHopType;
}

export interface ResolveSuccess {
  success: true;
  originalUrl: string;
  finalUrl: string;
  redirectCount: number;
  removedTracking: boolean;
  removedTrackingCount: number;
  chain: ChainHop[];
  processingTimeMs: number;
}

export interface ResolveFailure {
  success: false;
  error: string;
  message: string;
}

export type ResolveResponse = ResolveSuccess | ResolveFailure;

export interface HistoryEntry {
  originalUrl: string;
  finalUrl: string;
  redirectCount: number;
  removedTracking: boolean;
  timestamp: string;
}

export interface AdminStats {
  success: true;
  totalRequests: number;
  successful: number;
  failed: number;
  successRate: number;
  averageProcessingTimeMs: number;
  topDomains: { domain: string; count: number }[];
  errorBreakdown: { code: string; count: number }[];
  rateLimited: number;
}

export type ProcessStage =
  | "idle"
  | "validating"
  | "analyzing"
  | "detecting"
  | "following"
  | "finding"
  | "done";
