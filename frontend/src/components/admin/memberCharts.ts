import type { MemberProfile } from '@/types/member.types';
import type { BarSegment } from './StackedBar';
import { MEMBER_STANDING, STANDING_ORDER, STANDING_TONE } from './positions';

export interface CollegeGroup {
  key: string;
  label: string;
  members: MemberProfile[];
}

/** Members grouped by college / department (merged case-insensitively), biggest group first. */
export function groupByCollege(list: MemberProfile[]): CollegeGroup[] {
  const map = new Map<string, CollegeGroup>();
  for (const m of list) {
    const label = m.collegeOrDept?.trim() || 'No college listed';
    const key = label.toLowerCase();
    const g = map.get(key) ?? { key, label, members: [] };
    g.members.push(m);
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => b.members.length - a.members.length || a.label.localeCompare(b.label));
}

/** A list of members as chart segments, one per standing (active, pending, expired, rejected). */
export function standingSegments(list: MemberProfile[]): BarSegment[] {
  return STANDING_ORDER.map((s) => ({ label: MEMBER_STANDING[s], value: list.filter((m) => m.status === s).length, tone: STANDING_TONE[s] }));
}

/** DOM id of a college's group on the Members board (the overview chart and the dashboard link to it). */
export function collegeGroupId(key: string) {
  return `college-${key.replace(/[^a-z0-9]+/g, '-')}`;
}
