import { api } from './api';
import type { UswagEvent, RsvpRecord, MyRsvp } from '@/types/event.types';

export async function listEvents(): Promise<UswagEvent[]> {
  const { data } = await api.get<{ success: boolean; data: UswagEvent[] }>('/events');
  return data.data;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  pillar: 'YOUTH_VOICE' | 'MENTAL_HEALTH' | 'ENVIRONMENTAL';
  scope: 'IN_CAMPUS' | 'OUT_OF_CAMPUS';
  location: string;
  startsAt: string; // ISO datetime string
  limitedSlots?: number | null;
  /** CONFIRMED publishes and notifies members; DRAFT stays private to officers. */
  status?: 'DRAFT' | 'CONFIRMED';
}

export async function createEvent(payload: CreateEventPayload): Promise<UswagEvent> {
  const { data } = await api.post<{ success: boolean; data: UswagEvent }>('/events', payload);
  return data.data;
}

/** Officers only: events saved as drafts (never returned by listEvents). */
export async function listDraftEvents(): Promise<UswagEvent[]> {
  const { data } = await api.get<{ success: boolean; data: UswagEvent[] }>('/events/drafts');
  return data.data;
}

/** Officers only: confirm a draft and notify members. */
export async function publishEvent(eventId: string): Promise<UswagEvent> {
  const { data } = await api.post<{ success: boolean; data: UswagEvent }>(`/events/${eventId}/publish`);
  return data.data;
}

export async function rsvpToEvent(eventId: string): Promise<RsvpRecord> {
  const { data } = await api.post<{ success: boolean; data: RsvpRecord }>(
    `/events/${eventId}/rsvp`,
  );
  return data.data;
}

/** The signed-in member's own RSVPs / applications. */
export async function listMyRsvps(): Promise<MyRsvp[]> {
  const { data } = await api.get<{ success: boolean; data: MyRsvp[] }>('/events/me/rsvps');
  return data.data;
}
