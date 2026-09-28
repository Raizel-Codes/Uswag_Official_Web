import type { ScanVerificationResponse } from "@/types/qr.types";

interface ScanResultCardProps {
  result: ScanVerificationResponse;
}

const CONFIG = {
  valid: {
    border: "border-l-success",
    iconBg: "bg-successBg",
    iconStroke: "var(--color-success)",
    icon: (
      <polyline points="20 6 9 17 4 12" />
    ),
    label: "Valid",
    labelCls: "text-success",
  },
  invalid: {
    border: "border-l-red-500",
    iconBg: "bg-red-50",
    iconStroke: "#ef4444",
    icon: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    label: "Invalid",
    labelCls: "text-red-500",
  },
  expired: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-50",
    iconStroke: "#f59e0b",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    label: "Expired",
    labelCls: "text-amber-500",
  },
} as const;

// Renders the valid / invalid / expired outcome from the scan console.
// Every result state renders clearly — do not collapse non-valid states into
// a generic error toast. See prototype/officer-admin.html verify-result.
export default function ScanResultCard({ result }: ScanResultCardProps) {
  const cfg = CONFIG[result.status];
  const memberName =
    result.status === "valid" && result.member ? result.member.name : "Unknown";
  const sub =
    result.status === "valid" && result.member
      ? result.member.serialNumber
      : result.reason ?? "Verification failed";

  return (
    <div
      className={
        "flex gap-3 items-center rounded-2xl bg-white p-4 shadow-sm border-l-4 " +
        cfg.border
      }
    >
      {/* Status icon */}
      <div
        className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-full " + cfg.iconBg}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          style={{ stroke: cfg.iconStroke }}
        >
          {cfg.icon}
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={"text-[10px] font-bold uppercase tracking-wide " + cfg.labelCls}>
          {cfg.label}
        </div>
        <h4 className="mt-0.5 font-heading text-[14px] font-bold text-forest truncate">
          {memberName}
        </h4>
        <div className="mt-0.5 text-[10.5px] text-gray-500 truncate">
          {sub} &middot; Logged {new Date(result.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
