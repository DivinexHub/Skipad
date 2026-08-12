interface Settings {
  autoOpen: boolean;
  stripAllParams: boolean;
}

interface SettingsPanelProps {
  open: boolean;
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ open, settings, onChange, onClose }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-end bg-black/50 p-4" onClick={onClose}>
      <div
        className="glass-card w-full max-w-xs p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-slate-100">Settings</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <Toggle
            label="Auto-open destination"
            description="Open the resolved link automatically when found."
            checked={settings.autoOpen}
            onToggle={() => onChange({ ...settings, autoOpen: !settings.autoOpen })}
          />
          <Toggle
            label="Strip all query parameters"
            description="Remove every query parameter from the final URL, not just known trackers."
            checked={settings.stripAllParams}
            onToggle={() => onChange({ ...settings, stripAllParams: !settings.stripAllParams })}
          />
        </div>

        <p className="mt-5 border-t border-white/8 pt-4 text-[11px] leading-relaxed text-slate-500">
          SkipAd never bypasses logins, paywalls, CAPTCHAs, or other access controls — it only
          follows redirects a browser would normally follow and labels the ones that look like
          ads or trackers.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent-blue" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
