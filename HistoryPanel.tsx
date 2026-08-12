interface HistoryItem {
  originalUrl: string;
  finalUrl: string;
  timestamp: string;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (url: string) => void;
  onClear: () => void;
}

export default function HistoryPanel({ items, onSelect, onClear }: HistoryPanelProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
          Recent URLs
        </p>
        <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300">
          Clear
        </button>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map((item, i) => (
          <li key={`${item.originalUrl}-${i}`}>
            <button
              onClick={() => onSelect(item.originalUrl)}
              className="w-full truncate rounded-lg px-2 py-1.5 text-left font-mono text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
              title={item.originalUrl}
            >
              {item.originalUrl}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
