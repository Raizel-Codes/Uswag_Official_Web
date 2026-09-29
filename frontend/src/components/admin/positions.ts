import type { OfficerPosition } from '@/types/auth.types';
import type { MembershipStatus } from '@/types/member.types';
import type { BarTone } from './StackedBar';

/** Membership standing as the console labels it (badges use .mp-standing--{status}). */
export const MEMBER_STANDING: Record<MembershipStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  rejected: 'Rejected',
};

/** Standing → chart colour, in the order the charts stack them. */
export const STANDING_ORDER: MembershipStatus[] = ['active', 'pending', 'expired', 'rejected'];
export const STANDING_TONE: Record<MembershipStatus, BarTone> = {
  active: 'success',
  pending: 'warn',
  expired: 'grey',
  rejected: 'danger',
};

// Officer titles exactly as Article VI of the Constitution names them.
export const POSITION_LABEL: Record<OfficerPosition, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  auditor: 'Auditor',
  business_manager: 'Business Manager',
  pro: 'Public Relations Officer',
};

export function positionLabel(position?: OfficerPosition | null) {
  return position ? POSITION_LABEL[position] : 'Officer';
}
