import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { officerService } from '../../services/officerService';
import { listEvents } from '../../services/eventService';
import { listNewsPosts } from '../../services/postService';
import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import Logo from '../../components/common/Logo';
import CountUp from '../../components/common/CountUp';
import CornerFrame from '../../components/common/CornerFrame';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { gsap, ScrollTrigger, ensureGsapRegistered, prefersReducedMotion } from '../../lib/motion';

ensureGsapRegistered();

// Drop a real photo at this path (frontend/public/images/hero-cover.jpg) to replace
// the vector badge below. Until then the <img> 404s silently and the existing
// topographic/badge visual remains the fallback — the page never looks broken.
const HERO_IMAGE_SRC = '/images/hero-cover.jpg';

// Only show the mobile sticky bar on the homepage
function MobileStickyBar() {
  const { pathname } = useLocation();
  if (pathname !== '/') return null;
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-forest/10 z-40 shadow-[0_-8px_24px_rgba(20,39,24,0.08)]"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', padding: '12px 20px' }}>
      <Link
        to="/join"
        className="block bg-primary text-white text-center py-3.5 rounded-[14px] font-bold text-[14.5px]"
      >
        Join USWAG Today
      </Link>
    </div>
  );
}

function TopoSVG() {
  return (
    <svg className="w-full h-full absolute inset-0 text-sage/20 opacity-40" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" fill="none">
      <path d="M0 300 Q 200 100 400 300 T 800 300" stroke="currentColor" strokeWidth="1" />
      <path d="M0 350 Q 200 150 400 350 T 800 350" stroke="currentColor" strokeWidth="1" />
      <path d="M0 400 Q 200 200 400 400 T 800 400" stroke="currentColor" strokeWidth="1" />
      <path d="M0 450 Q 200 250 400 450 T 800 450" stroke="currentColor" strokeWidth="1" />
      <circle cx="400" cy="300" r="150" stroke="currentColor" strokeWidth="1" />
      <circle cx="400" cy="300" r="200" stroke="currentColor" strokeWidth="1" />
      <circle cx="400" cy="300" r="250" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}



export default function HomePage() {
  const { data: officers = [] } = useQuery({ queryKey: ['publicOfficers'], queryFn: officerService.getPublicRoster });
  const { data: events = [] } = useQuery({ queryKey: ['publicEvents'], queryFn: listEvents });
  const { data: posts = [] } = useQuery({ queryKey: ['publicPosts'], queryFn: listNewsPosts });

  // Take top 3 upcoming events + first 2 recent posts
  const upcomingEvents = events
    .filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3);
  const recentPosts = posts.slice(0, 2);
  
  const president = officers.find(o => o.officerPosition === 'PRESIDENT');
  const vp = officers.find(o => o.officerPosition === 'VICE_PRESIDENT');
  const restOfficers = officers.filter(o => o.officerPosition !== 'PRESIDENT' && o.officerPosition !== 'VICE_PRESIDENT').slice(0, 5);

  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const pageScope = useScrollReveal();
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Hero stats reveal: fades/slides the stat row in as it scrolls into view.
  //
  // This was originally a therecord.institute-style pinned intro (ScrollTrigger pin:true,
  // holding the hero in place while the stats scrub in). Built and tested it, and pulled it:
  // GSAP's pin sets the pinned element to `position: fixed` and manages its own spacer, and
  // that interacted badly with this site's already-`position: fixed` Header — verified in the
  // browser, it produced a real visual gap/jump partway through the pin range, not just a
  // testing artifact. A broken flashy effect is worse than a solid simple one, especially for
  // this audience, so this stays a plain (unpinned) scroll-triggered reveal instead. The
  // CountUp numbers still animate independently once the row is in view.
  useGSAP(() => {
    if (prefersReducedMotion() || !heroRef.current || !statsRef.current) return;

    gsap.fromTo(
      statsRef.current,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, { scope: heroRef });

  // ScrollTrigger caches trigger start/end pixel positions on creation. In an SPA there's
  // no full page `load` event to hang a refresh off reliably, and this page's height keeps
  // changing after mount as the hero photo and the officers/events/posts queries resolve —
  // every one of those has to re-trigger a measurement, or start/end stay wrong and every
  // scroll-tied animation on the page (the pin included) silently never progresses.
  useEffect(() => {
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    // Belt-and-suspenders: web font swap (Lora/Poppins arrive after first paint) reflows
    // text and can invalidate a measurement taken this same tick, even after fonts.ready —
    // one more pass a moment later catches anything still settling.
    const timeout = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [heroImageFailed, officers.length, events.length, posts.length]);

  return (
    <div ref={pageScope} className="w-full bg-mist overflow-x-hidden font-body text-forest">

      {/* ===================== HERO ===================== */}
      <section ref={heroRef} className="relative pt-[clamp(4rem,8vw,6rem)] pb-0">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content — comes first on mobile so the headline, not decoration, is what loads and reads first */}
            <div className="order-1 md:order-1">
              <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-primary mb-5">
                <span className="w-6 h-px bg-primary shrink-0" />
                A cause-driven organization
              </div>
              <h1 className="font-display font-medium text-forest leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 5.25rem)', letterSpacing: '-0.025em' }}>
                Student voice,<br className="hidden md:block" /> wellness, and the <em className="italic text-primary">environment.</em>
              </h1>
              <p className="font-display italic text-primary text-lg leading-[1.6] max-w-[50ch] mb-11 pl-5 border-l-2 border-sage">
                USWAG unites NwSSU students around three core mandates—giving you a real seat at the table.
              </p>
              <div className="w-12 h-px bg-forest/15 mb-11" />
              <div className="flex flex-wrap gap-4">
                <Link to="/join" className="inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-white bg-primary hover:bg-forest transition-colors shadow-[0_4px_14px_rgba(46,91,65,0.25)] hover:shadow-[0_6px_20px_rgba(20,39,24,0.3)] hover:-translate-y-0.5 transform duration-250">
                  Become a Member
                </Link>
                <a href="#advocacies" className="inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-forest bg-transparent border-[1.5px] border-forest/15 hover:border-forest hover:bg-forest/5 transition-colors duration-250">
                  See our advocacies
                </a>
              </div>
            </div>

            {/* Visual Content — real photo when available, vector badge as a graceful fallback */}
            <div className="order-2 md:order-2 relative h-[280px] md:h-[520px] mt-2 md:mt-0 flex items-center justify-center overflow-hidden rounded-[3px] md:rounded-none">
              {!heroImageFailed && (
                <img
                  src={HERO_IMAGE_SRC}
                  alt="USWAG members at a campus advocacy event"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width={800}
                  height={520}
                  onError={() => setHeroImageFailed(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {!heroImageFailed && (
                <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/10 to-transparent" />
              )}

              {heroImageFailed && (
                <>
                  <TopoSVG />
                  <div className="relative z-10 text-center">
                    <div className="w-[140px] h-[140px] md:w-[180px] md:h-[180px] rounded-full border border-forest/15 mx-auto mb-6 flex items-center justify-center relative bg-mist/50 backdrop-blur-sm">
                      <div className="absolute inset-2.5 rounded-full border border-sage/20" />
                      <Logo size={72} showWordmark={false} />
                    </div>
                    <div className="font-display text-[1.5rem] md:text-[1.75rem] font-semibold tracking-[0.08em] text-forest">USWAG</div>
                    <div className="text-[0.65rem] md:text-[0.75rem] font-medium tracking-[0.12em] uppercase text-primary mt-1.5">Northwest Samar State University</div>
                  </div>
                </>
              )}

              {!heroImageFailed && (
                <div className="relative z-10 mt-auto p-6 md:p-8 text-left w-full">
                  <div className="font-display text-[1.375rem] md:text-[1.75rem] font-semibold tracking-[0.04em] text-white">USWAG</div>
                  <div className="text-[0.65rem] md:text-[0.75rem] font-medium tracking-[0.12em] uppercase text-sage mt-1.5">Northwest Samar State University</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Stats — placeholder figures; wiring these to live officer/event counts is a follow-up */}
        <div ref={statsRef} className="max-w-[1200px] mx-auto px-8 flex mt-16 border-t border-forest/15">
          {[
            { num: 486, label: 'Active Members' },
            { num: 3, label: 'Core Advocacies', pad: 2 },
            { num: 12, label: 'Events / Month' },
          ].map((stat, i) => (
            <div key={i} className={`flex-1 py-6 pr-3 mr-3 md:pr-6 md:mr-6 ${i !== 2 ? 'border-r border-forest/10' : ''}`}>
              <CountUp
                to={stat.num}
                padLength={stat.pad}
                className="block font-display text-[1.375rem] sm:text-[1.75rem] md:text-[2rem] font-semibold text-forest leading-none mb-1.5"
              />
              <div className="text-[0.5625rem] sm:text-[0.65rem] md:text-[0.75rem] font-medium uppercase tracking-[0.06em] sm:tracking-[0.1em] text-forest/60 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-forest/15 to-transparent w-full" />

      {/* ===================== ADVOCACIES (PILLARS) ===================== */}
      <section id="advocacies" className="py-[clamp(5rem,9vw,9rem)] bg-[#142718] relative overflow-hidden text-mist">
        {/* Top border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sage/30 to-transparent" />
        {/* Noise overlay — desktop only, skipped on mobile to save paint cost on mid-tier GPUs and because it's barely visible at small sizes anyway */}
        <div className="hidden md:block absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")' }} />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="mb-20">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              The Mandates
            </div>
            <h2 className="font-display font-medium text-mist leading-[1.08] mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.25rem)', letterSpacing: '-0.015em' }}>
              Three causes.<br />One organization.
            </h2>
            <p className="text-mist/60 text-[1.0625rem] leading-[1.75] max-w-[52ch]">
              Every USWAG program traces back to one of these advocacies — set out in our founding constitution and carried forward by every member.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
            {[
              {
                num: '01', title: 'Youth Voice &\nParticipation',
                desc: 'We push for meaningful student involvement in decision-making, governance, and civic leadership — a real seat at the table, not token representation.',
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-sage w-12 h-12 mb-8">
                    <path className="draw-path transition-all duration-[1.2s] ease-out stroke-dasharray-[300] stroke-dashoffset-[300] group-[.is-visible]:stroke-dashoffset-0" d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
                  </svg>
                )
              },
              {
                num: '02', title: 'Mental Health &\nWellness',
                desc: 'We build mental health literacy and peer support systems across campus, so wellness conversations happen before a crisis does — not after.',
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-sage w-12 h-12 mb-8">
                    <path className="draw-path transition-all duration-[1.2s] ease-out stroke-dasharray-[300] stroke-dashoffset-[300] group-[.is-visible]:stroke-dashoffset-0" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                )
              },
              {
                num: '03', title: 'Environmental\nLeadership',
                desc: 'We lead sustainability efforts and hands-on environmental programs, treating stewardship of our campus and coastline as a student responsibility.',
                svg: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-sage w-12 h-12 mb-8">
                    <path className="draw-path transition-all duration-[1.2s] ease-out stroke-dasharray-[300] stroke-dashoffset-[300] group-[.is-visible]:stroke-dashoffset-0" d="M12 3v18m0-18c-3 0-8 2-8 8s5 8 8 8m0-16c3 0 8 2 8 8s-5 8-8 8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              }
            ].map((pillar, i) => (
              <div key={i} className="group relative p-10 lg:p-12 border-l border-sage/15 hover:bg-sage/5 transition-colors duration-500 overflow-hidden" data-reveal>
                <CornerFrame corners={['tr', 'br']} variant="sage" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Growing left border */}
                <div className="absolute left-[-1px] top-0 w-[2px] h-0 bg-sage transition-all duration-[0.9s] ease-out group-[.is-visible]:h-full" />
                {/* Watermark */}
                <div className="absolute top-[-0.5rem] right-[1rem] font-display text-[9rem] font-bold text-sage/[0.06] leading-none pointer-events-none select-none tracking-[-0.05em]">{pillar.num}</div>
                {pillar.svg}
                <div className="font-display text-[0.75rem] font-semibold tracking-[0.18em] text-sage uppercase mb-5">{`Advocacy ${pillar.num}`}</div>
                <h3 className="font-display text-[1.375rem] text-mist mb-4 leading-[1.2] whitespace-pre-line">{pillar.title}</h3>
                <p className="text-mist/60 text-[0.9375rem] leading-[1.75] max-w-[36ch] relative z-10">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== OFFICERS CASCADE ===================== */}
      <section id="officers" className="py-[clamp(5rem,9vw,9rem)] bg-mist relative">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-primary mb-5">
              The Leadership
            </div>
            <h2 className="font-display font-medium text-forest leading-[1.08] mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.25rem)', letterSpacing: '-0.015em' }}>
              Led by students, for students.
            </h2>
            <p className="text-forest/60 text-[1.0625rem] leading-[1.75] max-w-[52ch] mx-auto mt-4">
              Seven constitutional positions — each with duties written directly into our constitution.
            </p>
          </div>

          {/* Mobile: simple stacked list — the absolute-positioned connector lines below are a
              desktop org-chart metaphor that costs DOM/paint for no visible benefit on a narrow screen. */}
          <div className="md:hidden space-y-6" data-reveal>
            {[president, vp].filter(Boolean).map((o) => (
              <div key={o!.id} className="flex items-center gap-4 bg-white rounded-[12px] border border-forest/10 p-4">
                <div className="w-[64px] h-[64px] shrink-0 rounded-full bg-sage/10 border-2 border-sage flex items-center justify-center font-display text-[1.125rem] font-medium text-primary overflow-hidden">
                  {o!.photoUrl ? (
                    <img src={o!.photoUrl} alt={o!.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    o!.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                  )}
                </div>
                <div>
                  <div className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-primary mb-1">{o!.officerPosition.replace(/_/g, ' ')}</div>
                  <div className="font-display text-[1.0625rem] font-medium text-forest leading-[1.2] mb-0.5">{o!.name}</div>
                  <div className="text-[0.75rem] text-forest/60 font-normal">{o!.collegeOrDept}</div>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              {restOfficers.map((off) => (
                <div key={off.id} className="flex flex-col items-center text-center bg-white rounded-[12px] border border-forest/10 p-4">
                  <div className="w-[56px] h-[56px] rounded-full bg-primary/5 border-[1.5px] border-forest/15 flex items-center justify-center font-display text-[1rem] font-medium text-primary mb-3 overflow-hidden">
                    {off.photoUrl ? (
                      <img src={off.photoUrl} alt={off.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      off.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                    )}
                  </div>
                  <div className="text-[0.625rem] font-bold tracking-[0.08em] uppercase text-primary mb-1 leading-tight">{off.officerPosition.replace(/_/g, ' ')}</div>
                  <div className="font-display text-[0.9375rem] font-medium text-forest leading-[1.2] mb-0.5">{off.name}</div>
                  <div className="text-[0.6875rem] text-forest/60 font-normal">{off.collegeOrDept}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop/tablet: the full cascade org-chart, with room to breathe */}
          <div className="hidden md:flex md:flex-col items-center relative group" data-reveal>
            {/* President Tier */}
            <div className="relative w-full flex justify-center pb-16">
              {/* Vertical line from Pres to VP */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-0 bg-gradient-to-b from-sage to-sage/30 transition-all duration-1000 delay-500 group-[.is-visible]:h-16" />
              {president && (
                <div className="group/card flex flex-col items-center text-center w-[220px] relative pt-8">
                  <div className="w-[100px] h-[100px] rounded-full bg-sage/10 border-2 border-sage shadow-[0_0_0_4px_rgba(152,203,176,0.1)] flex items-center justify-center font-display text-[1.625rem] font-medium text-primary mb-[1.125rem] transition-all duration-500 ease-out group-hover/card:bg-sage/20 group-hover/card:-translate-y-1 group-hover/card:shadow-[0_8px_24px_rgba(46,91,65,0.15)] relative overflow-hidden">
                    {president.photoUrl ? (
                      <img src={president.photoUrl} alt={president.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      president.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                    )}
                  </div>
                  <div className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary mb-1.5">{president.officerPosition.replace(/_/g, ' ')}</div>
                  <div className="font-display text-[1.125rem] font-medium text-forest leading-[1.2] mb-1">{president.name}</div>
                  <div className="text-[0.75rem] text-forest/60 font-normal">{president.collegeOrDept}</div>
                </div>
              )}
            </div>

            {/* VP Tier */}
            <div className="relative w-full flex justify-center pb-16">
              {/* Vertical line from VP to connector */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-0 bg-gradient-to-b from-sage/50 to-sage/20 transition-all duration-1000 delay-[800ms] group-[.is-visible]:h-16" />
              {vp && (
                <div className="group/card flex flex-col items-center text-center w-[200px] relative pt-8">
                  <div className="w-[88px] h-[88px] rounded-full bg-primary/5 border-[1.5px] border-forest/15 flex items-center justify-center font-display text-[1.5rem] font-medium text-primary mb-[1.125rem] transition-all duration-500 ease-out group-hover/card:bg-sage/20 group-hover/card:border-sage group-hover/card:-translate-y-1 group-hover/card:shadow-[0_8px_24px_rgba(46,91,65,0.15)] relative overflow-hidden">
                    {vp.photoUrl ? (
                      <img src={vp.photoUrl} alt={vp.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      vp.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                    )}
                  </div>
                  <div className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary mb-1.5">{vp.officerPosition.replace(/_/g, ' ')}</div>
                  <div className="font-display text-[1.0625rem] font-medium text-forest leading-[1.2] mb-1">{vp.name}</div>
                  <div className="text-[0.75rem] text-forest/60 font-normal">{vp.collegeOrDept}</div>
                </div>
              )}
            </div>

            {/* Horizontal Connector */}
            <div className="w-[75%] h-px bg-gradient-to-r from-transparent via-sage/40 to-transparent scale-x-0 origin-center transition-transform duration-[800ms] delay-1000 group-[.is-visible]:scale-x-100 mb-0" />

            {/* Officers Tier */}
            <div className="flex justify-center gap-8 w-full flex-wrap pt-0">
              {restOfficers.map((off) => (
                <div key={off.id} className={`group/card flex flex-col items-center text-center w-[180px] relative pt-8 [&.is-visible]:before:h-8 [&.is-visible]:after:scale-100`} data-reveal>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-0 bg-sage/30 transition-all duration-600" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 w-1.5 h-1.5 bg-sage rounded-full transition-transform duration-400 delay-300" />
                  
                  <div className="w-[80px] h-[80px] rounded-full bg-primary/5 border-[1.5px] border-forest/15 flex items-center justify-center font-display text-[1.375rem] font-medium text-primary mb-[1.125rem] transition-all duration-500 ease-out group-hover/card:bg-sage/20 group-hover/card:border-sage group-hover/card:-translate-y-1 group-hover/card:shadow-[0_8px_24px_rgba(46,91,65,0.15)] relative overflow-hidden">
                    {off.photoUrl ? (
                      <img src={off.photoUrl} alt={off.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      off.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                    )}
                  </div>
                  <div className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary mb-1.5">{off.officerPosition.replace(/_/g, ' ')}</div>
                  <div className="font-display text-[1rem] font-medium text-forest leading-[1.2] mb-1">{off.name}</div>
                  <div className="text-[0.75rem] text-forest/60 font-normal">{off.collegeOrDept}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ===================== PULSE (EVENTS + FB POSTS) ===================== */}
      <section id="pulse" className="py-[clamp(5rem,9vw,9rem)] bg-white border-t border-forest/10">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-24 items-start">
          
          {/* Timeline Sidebar (Events) */}
          <div className="md:sticky md:top-28">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-primary mb-5">
              <span className="w-6 h-px bg-primary shrink-0" />
              The Pulse
            </div>
            <h2 className="font-display font-medium text-forest leading-[1.08] mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.25rem)', letterSpacing: '-0.015em' }}>
              Upcoming actions
            </h2>
            <p className="text-forest/60 text-[1.0625rem] leading-[1.75] max-w-[52ch] mb-12">
              Our calendar of assemblies, outreach programs, and advocacy forums.
            </p>

            <div className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-sage before:to-sage/20">
              {upcomingEvents.length > 0 ? upcomingEvents.map(evt => {
                const d = new Date(evt.startsAt);
                return (
                  <div key={evt.id} className="relative pb-12 pl-6 last:pb-0 group" data-reveal>
                    {/* Pulse Dot */}
                    <div className="absolute left-[-2rem] top-1.5 w-[10px] h-[10px] rounded-full bg-mist border-2 border-sage scale-0 transition-transform duration-500 group-[.is-visible]:scale-100 after:absolute after:inset-[-4px] after:rounded-full after:border after:border-sage/40 after:opacity-0 group-[.is-visible]:after:opacity-100 group-[.is-visible]:after:animate-pulse-ring" />
                    
                    <div className="flex items-baseline gap-2 mb-2.5">
                      <span className="font-display text-[2.25rem] text-primary leading-none font-medium">{d.getDate()}</span>
                      <span className="text-[0.75rem] font-bold tracking-[0.1em] uppercase text-forest/60">{d.toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <h3 className="font-display text-[1.25rem] font-medium text-forest mb-2">{evt.title}</h3>
                    <div className="flex flex-wrap gap-5 text-[0.8125rem] font-medium text-forest/60 items-center">
                      <span>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1.5 before:content-['·'] before:text-base before:text-sage">{evt.location}</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-[13.5px] text-gray-400 py-4">No upcoming events right now. Check back soon.</p>
              )}
            </div>
            
            <Link to="/events" className="inline-flex items-center gap-2 mt-7 -my-3 py-3 font-sans text-[0.875rem] font-semibold text-primary hover:text-forest transition-colors">
              See full calendar <span className="text-xl">→</span>
            </Link>
          </div>

          {/* Facebook Posts Bento */}
          <div>
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-primary mb-8">
              <span className="w-6 h-px bg-primary shrink-0" />
              Latest Updates
            </div>
            <div className="space-y-8">
              {recentPosts.length > 0 ? recentPosts.map(post => (
                <div key={post.id} className="bg-mist rounded-[16px] p-8 hover:shadow-[0_8px_24px_rgba(20,39,24,0.06)] transition-shadow border border-forest/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-[32px] h-[32px] rounded-[8px] bg-[#1877F2] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="white" d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
                      </svg>
                    </div>
                    <div>
                      <b className="text-[0.875rem] font-semibold text-forest block leading-tight">USWAG Official Page</b>
                      <span className="text-[0.75rem] text-forest/60 font-medium">{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {post.imageUrl && (
                    <div className="mb-4 rounded-[10px] overflow-hidden aspect-[16/10] bg-forest/5">
                      <img
                        src={post.imageUrl}
                        alt="Photo from this Facebook post"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-[1.0625rem] text-forest/80 leading-[1.65] mb-4 whitespace-pre-wrap">{post.body}</p>
                  {post.permalink && (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 -my-3 py-3 font-sans text-[0.875rem] font-semibold text-[#1877F2] hover:underline">
                      View on Facebook <span className="text-xl">→</span>
                    </a>
                  )}
                </div>
              )) : (
                <p className="text-[13.5px] text-gray-400 py-4">No recent posts from our Facebook page.</p>
              )}
            </div>
            <Link to="/news" className="inline-flex items-center gap-2 mt-5 -my-3 py-3 font-sans text-[0.875rem] font-semibold text-primary hover:text-forest transition-colors">
              Read more news <span className="text-xl">→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ===================== JOIN CTA ===================== */}
      <section className="py-[clamp(5rem,9vw,9rem)] bg-mist">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="bg-primary rounded-[12px] p-[clamp(3rem,6vw,5rem)] grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center relative overflow-hidden">
            <CornerFrame corners={['tl', 'br']} variant="sage" />
            {/* Decorative arcs */}
            <div className="absolute -top-[60px] -right-[60px] w-[280px] h-[280px] rounded-full border border-sage/20 pointer-events-none" />
            <div className="absolute -top-[20px] -right-[20px] w-[180px] h-[180px] rounded-full border border-sage/10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
                <span className="w-6 h-px bg-sage shrink-0" />
                Membership
              </div>
              <h2 className="font-display font-medium text-mist leading-[1.08] mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.25rem)', letterSpacing: '-0.015em' }}>
                Your voice belongs here.
              </h2>
              <p className="text-mist/70 text-[1.0625rem] leading-[1.75] mt-4 max-w-[52ch]">
                Membership is open to every bona fide NwSSU student. Join a community that's still showing up for its causes long after election season ends.
              </p>
            </div>

            {/* Quick action button instead of full form */}
            <div className="relative z-10 flex flex-col items-start md:items-end justify-center">
                <Link to="/join" className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-mist text-forest font-sans text-[0.9375rem] font-semibold tracking-[0.02em] rounded-[3px] border-[1.5px] border-mist hover:bg-white hover:border-white hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(20,39,24,0.2)] transition-all duration-250">
                  Apply for Membership →
                </Link>
                <p className="text-mist/50 text-xs mt-4 text-center md:text-right w-full">Fast setup • Student ID required</p>
            </div>
          </div>
        </div>
      </section>

      <MobileStickyBar />
      <div className="md:hidden h-[72px]" />
    </div>
  );
}
