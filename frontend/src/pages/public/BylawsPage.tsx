import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

interface Amendment {
  id: string;
  article: string;
  section: string;
  proposedText: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const ARTICLES = [
  { n: 'I', title: 'Name and Principal Office', summary: 'Establishes the organization\'s official name as United Students Working for Advocacy and Growth (USWAG) and sets the principal office at NwSSU Main Campus, Calbayog City, Samar.' },
  { n: 'II', title: 'Declaration of Principles and Objectives', summary: 'Sets forth the three advocacy pillars: Youth Voice & Participation, Mental Health & Wellness, and Environmental Leadership. All programs must align with one of these mandates.' },
  { n: 'III', title: 'Membership and Dues', summary: 'Any bona fide NwSSU undergraduate student may apply for membership. Annual dues of ₱50.00 are required. Membership is renewable each academic year. Failure to renew results in inactive status.' },
  { n: 'IV', title: 'Rights and Duties of Members', summary: 'Active members have the right to vote, hold office (if eligible), attend all events, and receive a digital QR membership card. Members are duty-bound to attend at minimum two assemblies or events per semester and to uphold the organization\'s advocacy pillars.' },
  { n: 'V', title: 'The General Assembly', summary: 'The highest decision-making body. Regular assemblies are held at least once per semester. Special assemblies may be called by the President or upon written request of at least one-third of active members. A quorum is required for all binding resolutions.' },
  { n: 'VI', title: 'The Executive Officers and Their Duties', summary: 'Seven elected positions: President, Vice President, Secretary, Treasurer, Auditor, Business Manager, and Public Relations Officer. Each has constitutionally defined duties. Officers serve for one academic year and are elected annually by the General Assembly.' },
  { n: 'VII', title: 'Elections', summary: 'Elections are held annually at the end of the academic year. All active members in good standing are eligible to vote. Candidates must be active members with no pending disciplinary actions. A simple majority wins each position.' },
  { n: 'VIII', title: 'Funds and Finance', summary: 'All funds are managed by the Treasurer under the Auditor\'s oversight. Financial reports are presented every semester. Disbursements above a set threshold require co-signatures from the President and Treasurer. The fiscal year follows the academic calendar.' },
  { n: 'IX', title: 'Amendments', summary: 'Amendments to this Constitution may be proposed by any active member. Proposed amendments must be approved by a two-thirds vote of the General Assembly and ratified at a subsequent meeting. All amendments are logged and published publicly.' },
];

export default function BylawsPage() {
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const { data: amendments = [], isLoading } = useQuery({
    queryKey: ['amendments-public'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Amendment[] }>('/bylaws/amendments');
      return data.data.filter(a => a.status === 'APPROVED');
    },
  });

  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24 min-h-screen">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              Transparency &amp; Accountability
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Constitution <em className="italic text-sage">&amp;</em> By-Laws
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[52ch]">
              The governing document of USWAG. Every rule, duty, and process we follow is written here — and publicly available to all students.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[800px] mx-auto px-8 pt-16">

        {/* Download card */}
        <div className="bg-white border-l-2 border-sage p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_2px_10px_rgba(20,39,24,0.02)] mb-16">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-mist flex items-center justify-center shrink-0 border border-forest/10">
              <svg className="w-5 h-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-medium text-[1.125rem] text-forest">USWAG Constitution &amp; By-Laws</h3>
              <p className="text-[0.875rem] text-forest/60 mt-1">Official governing document — ratified and in effect</p>
            </div>
          </div>
          <a
            href="/constitution.pdf"
            download
            className="shrink-0 bg-forest text-white px-6 py-3 font-sans text-[0.875rem] font-semibold hover:bg-primary transition-colors uppercase tracking-wider"
          >
            Download PDF
          </a>
        </div>

        {/* Articles accordion */}
        <div className="mb-16">
          <div className="flex items-baseline justify-between border-b border-forest/10 pb-3 mb-6">
            <h2 className="font-display text-[1.25rem] font-medium text-forest">Table of Contents</h2>
          </div>
          
          <div className="bg-white border border-forest/10 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
            {ARTICLES.map((art, idx) => {
              const isOpen = openArticle === art.n;
              return (
                <div key={art.n} className="border-b border-forest/10 last:border-0 group">
                  <button
                    onClick={() => setOpenArticle(isOpen ? null : art.n)}
                    className="w-full text-left flex items-center justify-between px-8 py-5 focus:outline-none hover:bg-mist/30 transition-colors"
                  >
                    <div className="flex items-center gap-5">
                      <span className="font-display font-bold text-[1.125rem] text-sage/60 w-12 shrink-0">
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>
                      <span className="font-display font-medium text-[1.125rem] text-forest group-hover:text-primary transition-colors">{art.title}</span>
                    </div>
                    <span className={`text-sage shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 pb-6 px-8' : 'max-h-0 opacity-0 px-8'}`}>
                    <div className="pl-[4.25rem] border-l border-forest/10 ml-6">
                      <p className="text-[0.9375rem] text-forest/70 leading-[1.75] pl-4">
                        {art.summary}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Amendments */}
        <div>
          <div className="flex items-baseline justify-between border-b border-forest/10 pb-3 mb-6">
            <h2 className="font-display text-[1.25rem] font-medium text-forest">Approved Amendments</h2>
            <span className="text-[0.75rem] font-bold uppercase tracking-widest text-forest/40">Log per Article IX</span>
          </div>

          {isLoading ? (
            <div className="text-[0.9375rem] text-forest/40 animate-pulse border border-dashed border-forest/20 p-8 text-center bg-white">Loading amendments...</div>
          ) : amendments.length === 0 ? (
            <div className="bg-white p-12 text-center border border-dashed border-forest/20 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
              <p className="font-display text-[1.125rem] text-forest/60 mb-1">No approved amendments on record yet.</p>
              <p className="text-[0.875rem] text-forest/40">All constitutional changes will be logged here publicly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {amendments.map(a => (
                <div key={a.id} className="bg-white p-8 border border-forest/10 shadow-[0_2px_10px_rgba(20,39,24,0.02)] relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage" />
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-display font-medium text-[1.125rem] text-forest">Article {a.article}, Section {a.section}</h4>
                    <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-primary border border-primary/20 px-2 py-0.5 rounded">Approved</span>
                  </div>
                  <p className="text-[1.0625rem] text-forest/80 leading-[1.75] italic">"{a.proposedText}"</p>
                  <div className="text-[0.8125rem] text-forest/40 mt-5 pt-4 border-t border-forest/5 font-medium">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
