import { useQuery } from "@tanstack/react-query";
import { getMyAttendance } from "@/services/attendanceService";
import type { AttendanceHistoryEntry, MemberAttendanceHistory } from "@/types/event.types";

// Per-pillar icon, matching prototype/member.html's .attend-icon set.
const PILLAR_ICON: Record<string, JSX.Element> = {
  ENVIRONMENTAL: (
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
  ),
  MENTAL_HEALTH: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  YOUTH_VOICE: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
};

const RESULT_STYLES: Record<AttendanceHistoryEntry["result"], { badge: string; label: string }> = {
  VALID: { badge: "bg-successBg text-success", label: "Present" },
  EXPIRED: { badge: "bg-amber-50 text-amber-600", label: "Expired" },
  INVALID: { badge: "bg-red-50 text-red-600", label: "Invalid" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AttendanceRow({ entry }: { entry: AttendanceHistoryEntry }) {
  const pillarIcon = entry.event ? PILLAR_ICON[entry.event.pillar] : null;
  const style = RESULT_STYLES[entry.result];

  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px] stroke-primary"
        >
          {pillarIcon ?? <circle cx="12" cy="12" r="9" />}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <h5 className="font-heading truncate text-[13px] font-bold text-forest">
          {entry.event?.title ?? "Unknown Event"}
        </h5>
        <span className="text-[11px] text-gray-500">
          {formatDate(entry.scannedAt)}
          {entry.reason ? ` · ${entry.reason}` : ""}
        </span>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${style.badge}`}>
        {style.label}
      </span>
    </div>
  );
}

export default function MyAttendancePage() {
  const { data, isLoading, error } = useQuery<MemberAttendanceHistory>({
    queryKey: ["member", "attendance"],
    queryFn: getMyAttendance,
    staleTime: 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-mist pb-24 md:pb-8">
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-[19px] font-bold text-forest">My Attendance</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Every scan of your membership QR, logged in real time
        </p>
      </div>

      <div className="px-5 pt-4">
        {/* Summary stats */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="font-heading text-[18px] font-extrabold text-primary">
                {data.totalScans}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Total Scans</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="font-heading text-[18px] font-extrabold text-success">
                {data.validScans}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Present</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="font-heading text-[18px] font-extrabold text-forest">
                {data.attendanceRate}%
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Attendance Rate</div>
            </div>
          </div>
        ) : null}

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
            Couldn&apos;t load your attendance history. Try again shortly.
          </div>
        )}

        {/* History list */}
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="font-heading text-[14px] font-bold text-forest">History</h3>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : !data || data.records.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-2 h-8 w-8 stroke-gray-300"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-[12.5px] font-medium text-gray-500">No attendance records yet.</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Events you attend will appear here after your QR is scanned.
            </p>
          </div>
        ) : (
          data.records.map((entry) => <AttendanceRow key={entry.id} entry={entry} />)
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
