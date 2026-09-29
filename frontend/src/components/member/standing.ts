import type { MembershipStatus } from '@/types/member.types';

// Membership standing (Article III) as the member portal presents it. The reason text for a
// locked card / RSVP comes from the server (MemberProfile.standingNote); these are only labels.
export const STANDING_LABEL: Record<MembershipStatus, string> = {
  active: 'Active member',
  pending: 'Application pending',
  expired: 'Membership expired',
  rejected: 'Application not approved',
};

export function isActive(status: MembershipStatus | undefined) {
  return status === 'active';
}

/** The server's message for a failed request (403 reasons, 409 "event finished", …). */
export function errorMessage(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string } }; name?: string; message?: string } | null;
  return e?.response?.data?.message ?? (e?.name === 'ForbiddenError' ? e.message : undefined) ?? fallback;
}
