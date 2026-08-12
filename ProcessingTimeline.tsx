import type { ProcessStage } from "../types";

const STAGES: { key: ProcessStage; label: string }[] = [
  { key: "validating", label: "URL validated" },
  { key: "analyzing", label: "Analyzing redirect" },
  { key: "detecting", label: "Detecting advertisement / interstitial" },
  { key: "following", label: "Following safe redirects" },
  { key: "finding", label: "Finding destination" },
  { key: "done", label: "Result ready" },
];

const ORDER: ProcessStage[] = ["validating", "analyzing", "detecting", "following", "finding", "done"];

export default function ProcessingTimeline({ stage }: { stage: ProcessStage }) {
  const currentIndex = ORDER.indexOf(stage);

  return (
    <div className="glass-card relative overflow-hidden p-6">
      <div className="scanline absolute inset-0 opacity-40" />
      <p className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-accent-cyan">
        Processing
      </p>
      <ol className="space-y-3.5">
        {STAGES.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.key} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? "border-accent-blue bg-accent-blue/20 text-accent-cyan"
                    : active
                    ? "border-accent-purple bg-accent-purple/20 text-accent-purple pulse-ring"
                    : "border-white/15 text-slate-600"
                }`}
              >
                {done ? "✓" : active ? "•" : ""}
              </span>
              <span className={done || active ? "text-slate-200" : "text-slate-600"}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
