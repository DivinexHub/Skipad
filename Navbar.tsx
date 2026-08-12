interface NavbarProps {
  view: "app" | "admin";
  onNavigate: (view: "app" | "admin") => void;
  onToggleSettings: () => void;
}

export default function Navbar({ view, onNavigate, onToggleSettings }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-base-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={() => onNavigate("app")}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient text-white shadow-glow">
            ⏭
          </span>
          <span>
            Skip<span className="text-accent-blue">Ad</span>
          </span>
        </button>

        <nav className="flex items-center gap-2 text-sm">
          <button
            onClick={() => onNavigate("app")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              view === "app" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Resolver
          </button>
          <button
            onClick={() => onNavigate("admin")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              view === "admin" ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Admin
          </button>
          <button
            onClick={onToggleSettings}
            aria-label="Settings"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            ⚙
          </button>
        </nav>
      </div>
    </header>
  );
}
