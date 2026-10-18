// Event types mirror the Prisma schema exactly.
// Prisma returns enum values in UPPERCASE (YOUTH_VOICE, IN_CAMPUS, etc.)
// The frontend maps these for display — never send lowercase to the backend.

export type EventPillar = 'YOUTH_VOICE' | 'MENTAL_HEALTH' | 'ENVIRONMENTAL';
export type EventScope = 'IN_CAMPUS' | 'OUT_OF_CAMPUS';
export type EventStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface UswagEvent {
  id: string;
  title: string;
  pillar: EventPillar;
  scope: EventScope;
  status: EventStatus;
  location: string;
  startsAt: string; // ISO datetime
  description: string;
  limitedSlots?: number | null;
  // _count is included when the backend uses include: { _count: { select: { rsvps: true } } }
  _count?: { rsvps: number };
}

export interface RsvpRecord {
  eventId: string;
  memberId: string;
  status: 'going' | 'applied' | 'waitlisted';
}

/** GET /events/me/rsvps — one row per event the member signed up for. */
export interface MyRsvp {
  eventId: string;
  status: 'going' | 'applied' | 'waitlisted';
  createdAt: string;
}

export interface AttendanceRecord {
  eventId: string;
  memberId: string;
  scannedAt: string;
  scannedByOfficerId: string;
  result: 'VALID' | 'INVALID' | 'EXPIRED' | 'DUPLICATE';
}

// --- Attendance history (GET /members/me/attendance, GET /attendance) ---
// Mirrors backend/src/services/attendance.service.ts response shapes.

export interface AttendanceHistoryEntry {
  id: string;
  eventId: string;
  result: 'VALID' | 'INVALID' | 'EXPIRED' | 'DUPLICATE';
  reason: string | null;
  scannedAt: string;
  event: { id: string; title: string; startsAt: string; pillar: EventPillar } | null;
}

export interface MemberAttendanceHistory {
  records: AttendanceHistoryEntry[];
  totalScans: number;
  validScans: number;
  attendanceRate: number; // 0-100, valid / total for this member
}

export interface AttendanceOversightEntry extends AttendanceHistoryEntry {
  member: { id: string; user: { id: string; name: string } } | null;
  scannedByOfficer: { id: string; name: string; officerPosition: string | null };
}

export interface AttendanceStats {
  totalScans: number;
  validScans: number;
  invalidScans: number;
  expiredScans: number;
  validRate: number; // 0-100, org-wide valid / total scans
}

// --- Display helpers ---

export const PILLAR_LABELS: Record<EventPillar, string> = {
  YOUTH_VOICE: 'Youth Voice',
  MENTAL_HEALTH: 'Mental Health',
  ENVIRONMENTAL: 'Environmental',
};

export const SCOPE_LABELS: Record<EventScope, string> = {
  IN_CAMPUS: 'In-Campus',
  OUT_OF_CAMPUS: 'Out-of-Campus',
};

export const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
