import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const ADVOCACIES = [
  {
    id: 'youth',
    num: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary w-14 h-14 mb-8">
        <path className="draw-path transition-all duration-[1.2s] ease-out stroke-dasharray-[300] stroke-dashoffset-[300] group-[.is-visible]:stroke-dashoffset-0" d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
    title: 'Youth Voice & Participation',
    subtitle: 'Governance & Civic Leadership',
    desc: 'We push for meaningful student involvement in decision-making, governance, and civic leadership — not token representation, but a real seat at the table for how this university is run. Every student has a stake in NwSSU\'s direction, and USWAG ensures that stake is recognized.',
    programs: ['Student Leaders\' Forums', 'Voter Education Campaigns', 'Policy Dialogues with Admin', 'Parliamentary Training', 'Youth Leadership Workshops', 'Civic Rights Orientations'],
    stat: { value: '4+', label: 'Forums per semester' },
  },
  {
    id: 'wellness',
    num: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary w-14 h-14 mb-8">
        <path className="draw-path transition-all duration-[1.2s] ease-out stroke-dasharray-[300] stroke-dashoffset-[300] group-[.is-visible]:stroke-dashoffset-0" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    title: 'Mental Health & Wellness',
    subtitle: 'Peer Support & Literacy',
    desc: 'We build mental health literacy and peer support systems across campus, so wellness conversations happen before a crisis does — not after. Mental health is as integral to academic success as any course requirement.',
    programs: ['Peer Support Training', 'Wellness Fairs & Workshops', 'Stress De-briefing Sessions', 'Safe Space Circles', 'Mental Health Awareness Month', 'Campus Counselor Partnerships'],
    stat: { value: '200+', label: 'Students reached per semester' },
  },
  {
    id: 'environment',
    num: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary w-14 h-14 mb-8">
        <path className="draw-path transition-all duration-[1.2s] ease-out stroke-dasharray-[300] stroke-dashoffset-[300] group-[.is-visible]:stroke-dashoffset-0" d="M12 3v18m0-18c-3 0-8 2-8 8s5 8 8 8m0-16c3 0 8 2 8 8s-5 8-8 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Environmental Leadership',
    subtitle: 'Sustainability & Stewardship',
    desc: 'We lead sustainability efforts and hands-on environmental programs, treating stewardship of our campus and coastline as a student responsibility, not someone else\'s job. From barangay to coastline, we show up.',
    programs: ['Coastal Cleanup Drives', 'Tree Planting Initiatives', 'Zero-Waste Campus Campaigns', 'Upcycling Workshops', 'Environmental Awareness Talks', 'Campus Greening Projects'],
    stat: { value: '500+', label: 'Seedlings planted this year' },
  },
];

export default function AdvocaciesPage() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
        }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              Our Mandates
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Three Pillars of <em className="italic text-sage">Action</em>
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[62ch]">
              As defined by Article II of the USWAG Constitution, all organizational programs and initiatives must align with one of our three core advocacies.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== ADVOCACIES ===================== */}
      <div className="max-w-[1200px] mx-auto px-8 pt-20">
        <div className="space-y-24">
          {ADVOCACIES.map((advocacy, idx) => (
            <div key={advocacy.id} className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-24 items-start group" data-reveal>
              
              {/* Visual / Title side */}
              <div className={`relative ${idx % 2 !== 0 ? 'lg:order-2' : ''}`}>
                <div className="absolute top-[-2rem] left-[-1rem] font-display text-[9rem] md:text-[12rem] font-bold text-forest/[0.03] leading-none pointer-events-none select-none tracking-[-0.05em] z-0">
                  {advocacy.num}
                </div>
                
                <div className="relative z-10">
                  {advocacy.icon}
                  <h2 className="font-display font-medium text-[2rem] md:text-[2.75rem] text-forest leading-[1.1] mb-2 tracking-tight">
                    {advocacy.title.split('&').map((part, i) => (
                      <span key={i}>
                        {part}
                        {i === 0 && <span className="italic font-light text-primary mx-2">&amp;</span>}
                      </span>
                    ))}
                  </h2>
                  <div className="text-[0.875rem] font-semibold tracking-[0.1em] text-primary uppercase mt-4">
                    {advocacy.subtitle}
                  </div>
                </div>

                {/* Stat Box */}
                <div className="mt-10 inline-flex flex-col bg-white border border-forest/10 p-6 shadow-[0_4px_20px_rgba(20,39,24,0.03)] relative overflow-hidden group-[.is-visible]:animate-[slideInUp_0.8s_ease-out_both]">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  <span className="font-display text-[2.5rem] font-medium text-forest leading-none mb-1">{advocacy.stat.value}</span>
                  <span className="text-[0.75rem] font-semibold uppercase tracking-widest text-forest/60">{advocacy.stat.label}</span>
                </div>
              </div>

              {/* Content side */}
              <div className={`pt-4 ${idx % 2 !== 0 ? 'lg:order-1' : ''}`}>
                <p className="text-forest/70 text-[1.125rem] leading-[1.8] mb-10">
                  {advocacy.desc}
                </p>

                <div>
                  <h4 className="text-[0.75rem] font-bold tracking-[0.15em] text-forest uppercase mb-5 font-display border-b border-forest/10 pb-2">Key Initiatives &amp; Programs</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                    {advocacy.programs.map((prog, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-primary mt-1">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="text-[0.9375rem] text-forest/80 font-medium">{prog}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </div>

      {/* ===================== JOIN CTA ===================== */}
      <div className="max-w-[1200px] mx-auto px-8 mt-32 mb-10">
        <div className="bg-primary border border-primary-light p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(152,203,176,0.1),transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-[600px] mx-auto">
            <h2 className="font-display font-medium text-[2rem] text-mist mb-4 tracking-tight">Ready to step up?</h2>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] mb-8">
              Join USWAG and turn your advocacy into action. Membership is open to all NwSSU students.
            </p>
            <Link to="/join" className="inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-primary bg-mist hover:bg-white transition-colors">
              Apply for Membership
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
