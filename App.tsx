import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import UrlInputCard from "./components/UrlInputCard";
import ProcessingTimeline from "./components/ProcessingTimeline";
import RedirectChainViewer from "./components/RedirectChainViewer";
import ResultCard from "./components/ResultCard";
import ErrorState from "./components/ErrorState";
import HistoryPanel from "./components/HistoryPanel";
import SettingsPanel from "./components/SettingsPanel";
import AdminDashboard from "./components/AdminDashboard";
import { resolveUrl } from "./api";
import type { ProcessStage, ResolveSuccess, HistoryEntry } from "./types";

const STAGE_SEQUENCE: ProcessStage[] = ["validating", "analyzing", "detecting", "following", "finding"];
const HISTORY_KEY = "skipad_history";
const SETTINGS_KEY = "skipad_settings";

type AppView = "app" | "admin";

export default function App() {
  const [view, setView] = useState<AppView>("app");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ autoOpen: false, stripAllParams: false });

  const [inputValue, setInputValue] = useState("");
  const [stage, setStage] = useState<ProcessStage>("idle");
  const [result, setResult] = useState<ResolveSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const tickerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      if (rawHistory) setHistory(JSON.parse(rawHistory));
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawSettings) setSettings(JSON.parse(rawSettings));
    } catch {
      /* ignore corrupt local storage */
    }
  }, []);

  function persistHistory(next: HistoryEntry[]) {
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  function persistSettings(next: typeof settings) {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }

  function startTicker() {
    let i = 0;
    setStage(STAGE_SEQUENCE[0]);
    tickerRef.current = window.setInterval(() => {
      i += 1;
      if (i < STAGE_SEQUENCE.length) {
        setStage(STAGE_SEQUENCE[i]);
      } else if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
      }
    }, 420);
  }

  function stopTicker() {
    if (tickerRef.current) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }

  async function handleSubmit() {
    setResult(null);
    setErrorMessage(null);
    startTicker();

    const response = await resolveUrl(inputValue.trim());
    stopTicker();
    setStage("done");

    // brief pause on "Result ready" before revealing the card
    await new Promise((r) => setTimeout(r, 350));

    if (response.success) {
      setResult(response);
      const entry: HistoryEntry = {
        originalUrl: response.originalUrl,
        finalUrl: response.finalUrl,
        redirectCount: response.redirectCount,
        removedTracking: response.removedTracking,
        timestamp: new Date().toISOString(),
      };
      persistHistory([entry, ...history.filter((h) => h.originalUrl !== entry.originalUrl)].slice(0, 8));

      if (settings.autoOpen) {
        window.open(response.finalUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      setErrorMessage(response.message);
    }
    setStage("idle");
  }

  function handleReset() {
    setResult(null);
    setErrorMessage(null);
    setInputValue("");
    setStage("idle");
  }

  const isProcessing = stage !== "idle" && stage !== "done";
  const showTimeline = stage !== "idle";

  return (
    <div className="min-h-screen">
      <Navbar view={view} onNavigate={setView} onToggleSettings={() => setSettingsOpen(true)} />
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={persistSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        {view === "admin" ? (
          <>
            <h1 className="mb-6 font-display text-2xl font-semibold text-slate-100">Admin dashboard</h1>
            <AdminDashboard />
          </>
        ) : (
          <>
            {!result && !errorMessage && !showTimeline && (
              <div className="mb-10 text-center">
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
                  Skip<span className="text-accent-blue">Ad</span>
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-slate-400 sm:text-base">
                  Skip unnecessary ad redirects and find the destination faster.
                </p>
              </div>
            )}

            <div className="space-y-5">
              {!showTimeline && !result && !errorMessage && (
                <UrlInputCard
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSubmit}
                  disabled={isProcessing}
                />
              )}

              {!showTimeline && !result && !errorMessage && (
                <p className="text-center text-xs uppercase tracking-widest text-slate-600">
                  Safe URL resolution • Redirect analysis • Tracking cleanup
                </p>
              )}

              {showTimeline && !result && !errorMessage && <ProcessingTimeline stage={stage} />}

              {result && <ResultCard result={result} onReset={handleReset} />}
              {result && result.chain?.length > 0 && <RedirectChainViewer chain={result.chain} />}

              {errorMessage && <ErrorState message={errorMessage} onRetry={handleReset} />}

              {!showTimeline && !result && !errorMessage && (
                <HistoryPanel
                  items={history}
                  onSelect={(url) => setInputValue(url)}
                  onClear={() => persistHistory([])}
                />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-[11px] text-slate-600 sm:px-6">
        SkipAd only follows redirects a browser already would. It never bypasses logins,
        paywalls, CAPTCHAs, or other access controls.
      </footer>
    </div>
  );
}
