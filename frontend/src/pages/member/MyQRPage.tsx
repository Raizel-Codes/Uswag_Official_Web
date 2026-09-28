import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyProfile } from "@/services/memberService";
import { getMyDigitalCard } from "@/services/qrService";
import { getMyAttendance } from "@/services/attendanceService";
import MemberQRCard from "@/components/qr/MemberQRCard";
import type { MemberProfile } from "@/types/member.types";
import type { MemberAttendanceHistory } from "@/types/event.types";

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
function QRCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-forest to-primary rounded-3xl p-6 animate-pulse">
      <div className="h-3 w-16 bg-white/20 rounded mb-4" />
      <div className="bg-white/10 rounded-2xl p-4 flex justify-center mb-4">
        <div className="h-[220px] w-[220px] bg-white/20 rounded-xl" />
      </div>
      <div className="h-4 w-32 bg-white/20 rounded mb-1.5" />
      <div className="h-3 w-40 bg-white/20 rounded mb-2" />
      <div className="h-2.5 w-48 bg-white/10 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function MyQRPage() {
  const { data: profile, isLoading: isProfileLoading } = useQuery<MemberProfile>({
    queryKey: ["member", "profile"],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000,
  });

  const { data: card, isLoading: isCardLoading } = useQuery<{
    qrValue: string;
    serialNumber: string;
  }>({
    queryKey: ["member", "qr-card"],
    queryFn: getMyDigitalCard,
    // QR tokens rarely change — only on annual renewal or admin re-generation.
    staleTime: 60 * 60 * 1000,
  });

  const isLoading = isProfileLoading || isCardLoading;

  const { data: attendance, isLoading: isAttendanceLoading } = useQuery<MemberAttendanceHistory>({
    queryKey: ["member", "attendance"],
    queryFn: getMyAttendance,
    staleTime: 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-mist pb-24 md:pb-8">
      {/* Page title */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-[19px] font-bold text-forest">My Membership</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Present this QR at events for attendance
        </p>
      </div>

      <div className="px-5 pt-4">
        {/* QR card */}
        {isLoading ? (
          <QRCardSkeleton />
        ) : card && profile ? (
          <MemberQRCard
            qrValue={card.qrValue}
            name={profile.name}
            serialNumber={card.serialNumber}
            collegeOrDept={profile.collegeOrDept}
          />
        ) : (
          <div className="rounded-3xl bg-gradient-to-br from-forest to-primary p-8 text-white text-center">
            <p className="text-sm text-white/70">Could not load your membership card.</p>
          </div>
        )}

        {/* Security note */}
        <div className="mt-4 flex gap-3 items-start rounded-2xl bg-white p-4 shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0 stroke-primary"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
          <p className="text-[11.5px] text-gray-500 leading-relaxed">
            This QR code is uniquely signed to your account and cannot be duplicated. Screenshots
            of another member&apos;s QR will be flagged as invalid when scanned.
          </p>
        </div>

        {/* Status pill */}
        {profile && (
          <div className="mt-3 flex justify-center">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold " +
                (profile.status === "active"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700")
              }
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (profile.status === "active" ? "bg-green-500" : "bg-amber-400")
                }
              />
              {profile.status === "active" ? "Active Member" : "Pending Member"}
              {" \u00b7 A.Y. "}
              {profile.academicYear.replace("-", "\u2013")}
            </span>
          </div>
        )}

        {/* Serial */}
        {card && (
          <div className="mt-2 text-center font-mono text-[10.5px] text-gray-400 tracking-wide">
            SERIAL \u00b7 {card.serialNumber} \u00b7 Signed &amp; Non-transferable
          </div>
        )}

        {/* Attendance history preview */}
        <div className="my-5 flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold text-forest">Attendance History</h3>
          {attendance && attendance.records.length > 0 && (
            <Link
              to="/dashboard/attendance"
              className="text-[11.5px] font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {isAttendanceLoading ? (
          <div className="space-y-2.5">
            <div className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        ) : !attendance || attendance.records.length === 0 ? (
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
              Events you attend will appear here after they are logged.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {attendance.records.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 stroke-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-heading truncate text-[12.5px] font-bold text-forest">
                    {entry.event?.title ?? "Unknown Event"}
                  </h5>
                  <span className="text-[10.5px] text-gray-500">
                    {new Date(entry.scannedAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " +
                    (entry.result === "VALID"
                      ? "bg-successBg text-success"
                      : entry.result === "EXPIRED"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-red-50 text-red-600")
                  }
                >
                  {entry.result === "VALID" ? "Present" : entry.result === "EXPIRED" ? "Expired" : "Invalid"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
