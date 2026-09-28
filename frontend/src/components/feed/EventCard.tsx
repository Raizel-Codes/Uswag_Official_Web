import type { UswagEvent } from '@/types/event.types';
import { formatDate } from '@/utils/formatters';

interface EventCardProps {
  event: UswagEvent;
  onRsvp?: () => void;
}

// See prototype/member.html Home & Events pages for the reference layout
// Using the new, sharper design system over heavy rounded shadows.
export default function EventCard({ event, onRsvp }: EventCardProps) {
  return (
    <div className="flex gap-4 bg-white p-4 shadow-[0_2px_8px_rgba(20,39,24,0.02)] items-center border-l-2 border-sage border-y border-r border-forest/10 hover:shadow-[0_4px_16px_rgba(20,39,24,0.04)] transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.15em] text-primary mb-1">
          {event.pillar.replace('_', ' ')}
        </div>
        <h4 className="font-heading font-medium text-[1.0625rem] text-forest leading-[1.3] truncate">{event.title}</h4>
        <div className="text-[0.8125rem] text-forest/60 font-medium mt-1 truncate">
          {event.location} <span className="mx-1 text-sage">·</span> {formatDate(event.startsAt)}
        </div>
      </div>
      {onRsvp && (
        <button onClick={onRsvp} className="shrink-0 text-[0.75rem] font-bold px-4 py-2 bg-mist text-forest hover:bg-forest hover:text-white transition-colors border border-forest/10 hover:border-forest uppercase tracking-wider">
          RSVP
        </button>
      )}
    </div>
  );
}
