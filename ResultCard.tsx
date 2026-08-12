import { useState } from "react";
import type { ResolveSuccess } from "../types";

interface ResultCardProps {
  result: ResolveSuccess;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="glass-card p-6 sm:p-7">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          ✓
        </span>
        <h2 className="font-display text-lg font-semibold text-slate-100">Destination Found</h2>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Original</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-400">{result.originalUrl}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Destination</p>
          <p className="mt-1 break-all font-mono text-sm font-medium text-emerald-300">{result.finalUrl}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={result.finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="accent-btn"
        >
          Open Destination
        </a>
        <button onClick={handleCopy} className="ghost-btn">
          {copied ? "Copied ✓" : "Copy URL"}
        </button>
        <button onClick={onReset} className="ghost-btn">
          Process Another URL
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/8 pt-5 text-center">
        <Stat label="Redirects followed" value={result.redirectCount} />
        <Stat label="Tracking removed" value={result.removedTrackingCount} />
        <Stat label="Processing time" value={`${(result.processingTimeMs / 1000).toFixed(2)}s`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold text-slate-100">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{label}</p>
    </div>
  );
}
