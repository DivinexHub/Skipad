import type { ChainHop, ChainHopType } from "../types";

const LABELS: Record<ChainHopType, string> = {
  original: "Original URL",
  redirect: "Redirect",
  tracking: "Tracking",
  advertisement: "Advertisement / Interstitial",
  final: "Final destination",
};

const STYLES: Record<ChainHopType, string> = {
  original: "border-white/15 text-slate-300",
  redirect: "border-accent-blue/40 text-accent-blue",
  tracking: "border-amber-400/40 text-amber-300",
  advertisement: "border-rose-400/40 text-rose-300",
  final: "border-emerald-400/50 text-emerald-300",
};

export default function RedirectChainViewer({ chain }: { chain: ChainHop[] }) {
  if (!chain || chain.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <p className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
        Redirect chain
      </p>
      <ol className="space-y-0">
        {chain.map((hop, i) => (
          <li key={`${hop.url}-${i}`}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STYLES[hop.type]}`}
                >
                  {LABELS[hop.type]}
                </span>
              </div>
            </div>
            <div className="ml-1 mt-1.5 flex items-start gap-2 pl-1">
              <span className="mt-0.5 text-[11px] text-slate-600">{hop.statusCode}</span>
              <p className="min-w-0 break-all font-mono text-xs text-slate-400">{hop.url}</p>
            </div>
            {i < chain.length - 1 && (
              <div className="my-2 ml-3 h-4 w-px bg-gradient-to-b from-white/20 to-transparent" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
