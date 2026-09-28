import { useQuery } from '@tanstack/react-query';
import { officerService } from '../../services/officerService';
import { Link } from 'react-router-dom';
import OfficerAvatar from '@/components/common/OfficerAvatar';
import OrnamentalDivider from '@/components/common/OrnamentalDivider';

const POSITION_ORDER = [
  'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER',
  'AUDITOR', 'BUSINESS_MANAGER', 'PRO',
];

const POSITION_LABELS: Record<string, string> = {
  PRESIDENT: 'President',
  VICE_PRESIDENT: 'Vice President',
  SECRETARY: 'Secretary',
  TREASURER: 'Treasurer',
  AUDITOR: 'Auditor',
  BUSINESS_MANAGER: 'Business Manager',
  PRO: 'Public Relations Officer',
};

const POSITION_DUTIES: Record<string, string> = {
  PRESIDENT: 'Chief executive officer of the organization; presides over all meetings; represents USWAG in all official functions; co-signs checks.',
  VICE_PRESIDENT: 'Assists the President; assumes the Presidency in their absence; oversees committee coordination.',
  SECRETARY: 'Keeps records of all proceedings; handles official correspondence; manages membership roster and minutes.',
  TREASURER: 'Collects dues and other funds; disburses funds with approval; prepares financial reports every semester.',
  AUDITOR: 'Examines financial records; ensures accuracy of accounts; presents audit reports to the General Assembly.',
  BUSINESS_MANAGER: 'Manages organizational assets and supplies; oversees fundraising activities; maintains inventory.',
  PRO: 'Disseminates information to members and the public; manages social media presence; prepares press releases.',
};

export default function OfficersPage() {
  const { data: officers = [], isLoading } = useQuery({
    queryKey: ['publicOfficers'],
    queryFn: officerService.getPublicRoster,
  });

  const sortedOfficers = [...officers].sort((a, b) => {
    const ai = POSITION_ORDER.indexOf(a.officerPosition);
    const bi = POSITION_ORDER.indexOf(b.officerPosition);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              Our Leadership
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Meet the <em className="italic text-sage">Officers</em>
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[62ch] mb-6">
              Seven constitutional positions leading USWAG, each with duties defined in Article VI of our Constitution. A.Y. 2026–2027.
            </p>
            <OrnamentalDivider variant="sage" />
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[1200px] mx-auto px-8 pt-20">

        {/* Org chart hint */}
        <div className="mb-12">
          <h2 className="text-[0.75rem] font-bold tracking-[0.15em] text-primary uppercase mb-6 font-display border-b border-forest/10 pb-2">Organizational Hierarchy</h2>
          <div className="flex flex-wrap gap-2 items-center text-[0.8125rem] font-medium text-forest/70">
            {POSITION_ORDER.map((pos, i) => (
              <span key={pos} className="flex items-center gap-2">
                <span className="bg-white border border-forest/10 px-3 py-1.5 font-semibold text-forest">
                  {POSITION_LABELS[pos] ?? pos.replace(/_/g, ' ')}
                </span>
                {i < POSITION_ORDER.length - 1 && (
                  <span className="text-forest/30 font-bold">→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Officer grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white p-6 border border-forest/10 animate-pulse">
                <div className="w-full aspect-square bg-forest/5 mb-4" />
                <div className="h-3.5 w-3/4 bg-forest/10 mb-2" />
                <div className="h-2.5 w-1/2 bg-forest/5 mb-4" />
                <div className="h-px w-full bg-forest/5 mb-4" />
                <div className="h-2 w-full bg-forest/5 mb-1.5" />
                <div className="h-2 w-4/5 bg-forest/5" />
              </div>
            ))}
          </div>
        ) : sortedOfficers.length === 0 ? (
          <div className="text-center py-20 text-forest/40 text-[0.9375rem] border border-dashed border-forest/15">
            No officers listed yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedOfficers.map((off) => {
              const duties = POSITION_DUTIES[off.officerPosition] ?? '';
              const label = POSITION_LABELS[off.officerPosition] ?? off.officerPosition.replace(/_/g, ' ');

              return (
                <div key={off.id} className="bg-white p-6 border border-forest/10 hover:border-sage hover:shadow-[0_8px_24px_rgba(20,39,24,0.04)] transition-all duration-300 group">
                  {/* Avatar — real photo when uploaded, cute placeholder illustration otherwise */}
                  <div className="w-full aspect-square mb-5 bg-mist flex items-center justify-center group-hover:bg-sage/10 transition-colors relative overflow-hidden">
                    {off.photoUrl ? (
                      <img src={off.photoUrl} alt={off.name} className="w-full h-full object-cover" />
                    ) : (
                      <OfficerAvatar seed={off.id} className="w-[70%] h-[70%] object-contain" />
                    )}
                  </div>
                  <h4 className="font-display font-medium text-[1.125rem] text-forest leading-[1.2]">{off.name}</h4>
                  <div className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary mt-1 mb-2">{label}</div>
                  <div className="text-[0.8125rem] text-forest/60 pb-4 border-b border-forest/10">{off.collegeOrDept}</div>
                  {duties && (
                    <p className="text-[0.8125rem] text-forest/70 leading-[1.65] mt-4">{duties}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Constitution reference */}
        <div className="mt-20 bg-forest text-mist p-10 md:p-14 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(152,203,176,0.1),transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-display font-medium text-[1.5rem] mb-2">Officer duties are constitutional</h3>
            <p className="text-mist/70 text-[1.0625rem] max-w-[42ch]">Every position's responsibilities are codified in Article VI of the USWAG Constitution.</p>
          </div>
          <Link to="/bylaws" className="relative z-10 shrink-0 inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-forest bg-mist hover:bg-white transition-colors">
            Read the Constitution
          </Link>
        </div>

      </div>
    </div>
  );
}
