import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listEvents } from "@/services/eventService";
import { useQRScanner } from "@/hooks/useQRScanner";
import QRScannerCamera from "@/components/qr/QRScannerCamera";
import ScanResultCard from "@/components/qr/ScanResultCard";
import LockedState from "@/components/common/LockedState";
import type { UswagEvent } from "@/types/event.types";
import type { ScanVerificationResponse } from "@/types/qr.types";

// ---------------------------------------------------------------------------
// Live scan log entry
// ---------------------------------------------------------------------------
function LogEntry({ entry }: { entry: ScanVerificationResponse }) {
  const initials =
    entry.status === "valid" && entry.member
      ? entry.member.name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "??";

  const name =
    entry.status === "valid" && entry.member ? entry.member.name : "Unknown";
  const sub =
    entry.status === "valid" && entry.member
      ? entry.member.serialNumber
      : entry.reason ?? "Verification failed";
  const time = new Date(entry.scannedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const badgeCls = {
    valid: "bg-successBg text-success",
    invalid: "bg-red-50 text-red-500",
    expired: "bg-amber-50 text-amber-600",
  }[entry.status];

  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist font-heading text-[12px] font-bold text-primary">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold text-forest truncate">{name}</div>
        <div className="text-[10.5px] text-gray-500 truncate">
          {time} \u00b7 {sub}
        </div>
      </div>
      <span className={"rounded-full px-2.5 py-1 text-[10px] font-bold " + badgeCls}>
        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ScanConsolePage() {
  const { user } = useAuth();

  // ---- Auditor guard — Article VI: Auditor has no scan access ----
  if (user?.officerPosition === "auditor") {
    return (
      <div className="px-5 py-6 max-w-md mx-auto">
        <h1 className="font-heading text-[19px] font-bold text-forest mb-1">Scan Console</h1>
        <p className="text-[12px] text-gray-500 mb-4">Verify membership QR at assigned events</p>
        <LockedState
          title="Scan Access Not Permitted"
          description="The Auditor role has read-only access to attendance records, but does not have live scan permissions (Article VI of the USWAG Constitution). Scan access is granted to the Secretary, Treasurer, Business Manager, and PRO."
          redirectLabel="View Attendance Records instead"
        />
      </div>
    );
  }

  return <ScanConsoleContent />;
}

// Separate component so the hook is never called for Auditors
function ScanConsoleContent() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [scanActive, setScanActive] = useState(false);
  const [scanLog, setScanLog] = useState<ScanVerificationResponse[]>([]);

  const { data: events, isLoading: isEventsLoading } = useQuery<UswagEvent[]>({
    queryKey: ["events"],
    queryFn: listEvents,
    staleTime: 2 * 60 * 1000,
  });

  const { result, isVerifying, error, handleDecoded, reset } = useQRScanner(selectedEventId);

  // When a result comes in, push it to the log and surface the card
  const prevResultRef = { current: null as ScanVerificationResponse | null };
  if (result && result !== prevResultRef.current) {
    prevResultRef.current = result;
    if (!scanLog.find((e) => e.scannedAt === result.scannedAt)) {
      setScanLog((prev) => [result, ...prev].slice(0, 50)); // keep last 50
    }
  }

  const activeEvents = (events ?? []).filter(
    (e) => e.status !== "COMPLETED" && e.status !== "CANCELLED",
  );

  const selectedEvent = activeEvents.find((e) => e.id === selectedEventId);

  function toggleScanner() {
    if (scanActive) {
      setScanActive(false);
    } else {
      if (!selectedEventId) return;
      reset();
      setScanActive(true);
    }
  }

  return (
    <div className="min-h-screen bg-mist pb-24 md:pb-8">
      {/* Page title */}
      <div className="px-5 lg:px-8 pt-6 pb-2">
        <h1 className="font-heading text-[19px] lg:text-[22px] font-bold text-forest">Scan Console</h1>
        <p className="text-[12px] lg:text-[13px] text-gray-500 mt-0.5">
          Verify membership QR at assigned events
        </p>
      </div>

      {/* Desktop: camera + log side by side, matching prototype's .scan-layout.
          Mobile/Officer Admin: stacked single column (unchanged). */}
      <div className="px-5 lg:px-8 pt-3 lg:grid lg:grid-cols-[380px_1fr] lg:gap-6 lg:items-start">
        <div>
          {/* Event selector */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11.5px] font-bold text-gray-600 uppercase tracking-wide">
              Scanning for event
            </label>
            {isEventsLoading ? (
              <div className="h-11 rounded-xl bg-gray-200 animate-pulse" />
            ) : (
              <select
                id="select-event"
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setScanActive(false);
                  reset();
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Select an event —</option>
                {activeEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({new Date(ev.startsAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Camera frame */}
          <div className="mb-4 overflow-hidden rounded-[22px] bg-forest p-4 shadow-lg">
            {/* Viewport with corner brackets */}
            <div className="relative mx-auto aspect-square w-full max-w-[260px] lg:max-w-none">
              {/* Scanner camera fills this container */}
              <QRScannerCamera onDecoded={handleDecoded} active={scanActive} />

              {/* Corner bracket overlays */}
              {scanActive && (
                <>
                  <div className="pointer-events-none absolute left-3 top-3 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-sage" />
                  <div className="pointer-events-none absolute right-3 top-3 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-sage" />
                  <div className="pointer-events-none absolute bottom-3 left-3 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-sage" />
                  <div className="pointer-events-none absolute bottom-3 right-3 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px] border-sage" />
                  {/* Animated scan line */}
                  <div
                    className="pointer-events-none absolute left-3 right-3 h-0.5"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #98CBB0, transparent)",
                      animation: "scanline 2.2s ease-in-out infinite",
                    }}
                  />
                </>
              )}

              {/* Idle state */}
              {!scanActive && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-forest/80">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10 stroke-sage/50"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Status line */}
            <div className="mt-3 text-center">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-white/50">
                {scanActive ? "SCANNING FOR" : "SCANNER PAUSED"}
              </div>
              <div className="mt-0.5 font-heading text-[14px] font-bold text-white">
                {selectedEvent ? selectedEvent.title : "No event selected"}
              </div>
            </div>
          </div>

          {/* Scan line CSS */}
          <style>{`
            @keyframes scanline {
              0%, 100% { top: 12px; }
              50% { top: calc(100% - 14px); }
            }
          `}</style>

          {/* Start / Stop button */}
          <button
            id="btn-toggle-scanner"
            disabled={!selectedEventId}
            onClick={toggleScanner}
            className={
              "mb-4 w-full rounded-2xl py-3.5 text-[13px] font-bold transition-colors focus:outline-none " +
              (!selectedEventId
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : scanActive
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-primary text-white hover:bg-primary-light")
            }
          >
            {scanActive ? "Stop Scanning" : "Start Scanning"}
          </button>
        </div>

        <div>
          {/* Verifying indicator */}
          {isVerifying && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <svg
                className="h-4 w-4 animate-spin stroke-primary"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-[12.5px] font-semibold text-forest">Verifying QR…</span>
            </div>
          )}

          {/* Network/API error */}
          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
              {error}
            </div>
          )}

          {/* Latest result */}
          {result && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-heading text-[14px] font-bold text-forest">Last Scan</h3>
                <button
                  id="btn-reset-scan"
                  onClick={reset}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
              <ScanResultCard result={result} />
            </div>
          )}

          {/* Live log */}
          <div className="my-4 flex items-center justify-between lg:my-0 lg:mb-3">
            <h3 className="font-heading text-[14px] font-bold text-forest">Live Log</h3>
            <span className="text-[11px] font-bold text-primary">
              {scanLog.filter((e) => e.status === "valid").length} checked in
            </span>
          </div>

          <div className="lg:max-h-[420px] lg:overflow-y-auto lg:pr-1">
            {scanLog.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
                <p className="text-[12.5px] font-medium text-gray-500">No scans yet this session.</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Scanned QR codes will appear here in real time.
                </p>
              </div>
            ) : (
              scanLog.map((entry, idx) => <LogEntry key={idx} entry={entry} />)
            )}
          </div>
        </div>

        <div className="h-4 lg:hidden" />
      </div>
    </div>
  );
}
