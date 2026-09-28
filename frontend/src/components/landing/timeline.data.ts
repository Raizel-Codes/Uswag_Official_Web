import type { TimelineEntry } from '@/types/landing.types';

/** Confirmed by the organisation (2026-09-28). */
export const FOUNDED_YEAR = 2010;

/**
 * "The years in between" — USWAG history.
 *
 * ⚠️ Entries with `confirmed: false` are PLACEHOLDERS awaiting confirmation from the USWAG
 * adviser. They render with a visible "Pending confirmation" badge and deliberately make no
 * factual claims. Replace each one with the verified year, title and one or two sentences,
 * then flip `confirmed` to true. Never invent milestones for a real organisation.
 */
export const TIMELINE: TimelineEntry[] = [
  {
    id: 'founding',
    label: String(FOUNDED_YEAR),
    dateTime: String(FOUNDED_YEAR),
    title: 'Founded at Northwest Samar State University',
    body: 'Students come together as USWAG — United Students Working for Advocacy and Growth.',
    confirmed: true,
  },
  {
    id: 'placeholder-1',
    label: '20—',
    title: 'Milestone to be confirmed',
    body: 'Details for this chapter of USWAG history are being verified with the organization’s adviser.',
    confirmed: false,
  },
  {
    id: 'placeholder-2',
    label: '20—',
    title: 'Milestone to be confirmed',
    body: 'Details for this chapter of USWAG history are being verified with the organization’s adviser.',
    confirmed: false,
  },
  {
    id: 'placeholder-3',
    label: '20—',
    title: 'Milestone to be confirmed',
    body: 'Details for this chapter of USWAG history are being verified with the organization’s adviser.',
    confirmed: false,
  },
  {
    id: 'digital',
    label: 'Today',
    title: 'A new chapter, online',
    body: 'Membership moves to signed digital cards, events check members in by QR, and every update lives in one place.',
    confirmed: true,
  },
];
