import { FormEvent } from "react";

interface UrlInputCardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function UrlInputCard({ value, onChange, onSubmit, disabled }: UrlInputCardProps) {
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text.trim());
    } catch {
      // Clipboard access denied - user can paste manually.
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim() && !disabled) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-6">
      <label htmlFor="url-input" className="sr-only">
        URL to resolve
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            id="url-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste URL here..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-white/10 bg-base-900/60 px-4 py-3.5 font-mono text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-accent-blue/60 disabled:opacity-60"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePaste}
            disabled={disabled}
            className="ghost-btn shrink-0"
          >
            Paste
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled || !value}
            className="ghost-btn shrink-0"
          >
            Clear
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="accent-btn mt-4 w-full sm:w-auto"
      >
        {disabled ? "Processing…" : "Skip Ad"}
        {!disabled && <span aria-hidden>→</span>}
      </button>
    </form>
  );
}
