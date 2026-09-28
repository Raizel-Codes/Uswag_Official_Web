import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'Do I need prior leadership experience?',
    a: 'No. USWAG is where you build that experience. We welcome anyone willing to learn and actively participate.',
  },
  {
    q: 'How long does my membership last?',
    a: 'Membership must be renewed every academic year to ensure our roster only reflects currently enrolled, active students (per Article III).',
  },
  {
    q: 'What if I miss an event?',
    a: 'We understand students are busy. However, falling below the required attendance threshold may affect your eligibility for limited-slot out-of-campus activities.',
  },
  {
    q: 'Is there a deadline for applications?',
    a: 'Applications are typically open at the start of each semester. Watch our Facebook Page and this website for announcements.',
  },
  {
    q: 'What does the ₱50.00 membership fee cover?',
    a: 'The fee covers the cost of QR ID generation, organizational materials, and program seed funding. It is payable to the Treasurer upon approval.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-forest/10 last:border-0 group">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left flex justify-between items-center py-5 gap-4 focus:outline-none"
      >
        <span className="font-display font-medium text-[1.125rem] text-forest group-hover:text-primary transition-colors">{q}</span>
        <span className={`text-sage shrink-0 transition-transform duration-300 ${open ? 'rotate-45 text-primary' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-40 opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
        <p className="text-[0.9375rem] text-forest/70 leading-[1.75] max-w-[65ch]">{a}</p>
      </div>
    </div>
  );
}

export default function JoinUsPage() {
  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24 min-h-screen">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              Membership Funnel
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Join <em className="italic text-sage">USWAG</em>
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[52ch]">
              Become part of a recognized student organization committed to Youth Voice, Mental Health &amp; Wellness, and Environmental Leadership.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[800px] mx-auto px-8 pt-16 space-y-20">

        {/* Eligibility */}
        <div className="relative group">
          <div className="absolute top-[-2rem] left-[-2rem] font-display text-[9rem] font-bold text-forest/[0.03] leading-none pointer-events-none select-none tracking-[-0.05em] z-0">
            01
          </div>
          <div className="relative z-10">
            <h2 className="font-display font-medium text-[2rem] text-forest mb-6 tracking-tight">Eligibility</h2>
            <p className="text-forest/70 text-[1.0625rem] leading-[1.75] mb-8">
              In accordance with <strong className="font-semibold text-forest">Article III</strong> of the Constitution, membership is open to any bona fide student of Northwest Samar State University (NwSSU), provided they:
            </p>
            
            <ul className="space-y-4 mb-10 pl-2">
              {[
                'Are currently enrolled in any undergraduate program at NwSSU.',
                'Fully support the three core advocacies of the organization.',
                'Commit to attending at least two (2) general assembly meetings or events per semester.'
              ].map((req, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary border border-primary/20 px-2 py-0.5 rounded mt-1 shrink-0">{i + 1}</span>
                  <span className="text-[1.0625rem] text-forest/80 leading-[1.6]">{req}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white border-l-2 border-sage p-8 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
              <h3 className="font-display font-medium text-[1.25rem] text-forest mb-2">Membership Dues</h3>
              <p className="text-[0.9375rem] text-forest/70 leading-[1.75]">
                To support our sustained programs and cover ID generation, an annual membership fee of <strong className="font-semibold text-forest">₱50.00</strong> is required, payable to the Treasurer upon approval of your application.
              </p>
            </div>
          </div>
        </div>

        {/* Application Process */}
        <div className="relative group">
          <div className="absolute top-[-2rem] left-[-2rem] font-display text-[9rem] font-bold text-forest/[0.03] leading-none pointer-events-none select-none tracking-[-0.05em] z-0">
            02
          </div>
          <div className="relative z-10">
            <h2 className="font-display font-medium text-[2rem] text-forest mb-8 tracking-tight">Application Process</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { n: '1', title: 'Apply Online', desc: 'Create an account and submit your membership application form.' },
                { n: '2', title: 'Orientation', desc: 'Attend a brief onboarding session about our Constitution and advocacies.' },
                { n: '3', title: 'Receive QR', desc: 'Pay dues and receive your official digital QR Membership Card.' },
              ].map(step => (
                <div key={step.n} className="bg-white p-6 border border-forest/10 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
                  <div className="text-sage font-display font-bold text-[2rem] leading-none mb-4">{step.n}</div>
                  <h4 className="font-display font-medium text-[1.125rem] text-forest mb-2">{step.title}</h4>
                  <p className="text-[0.875rem] text-forest/60 leading-[1.6]">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/15 p-8 mb-10">
              <h3 className="font-display font-medium text-[1.25rem] text-forest mb-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-primary">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Orientation Schedule
              </h3>
              <p className="text-[0.9375rem] text-forest/70 leading-[1.75]">
                New member orientation sessions are held at the beginning of each semester. Exact dates will be announced on our Facebook Page and posted here. Watch this space or follow us for updates.
              </p>
            </div>

            <div className="border-t border-forest/10 pt-10">
              <Link to="/apply" className="inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-white bg-primary hover:bg-forest transition-colors shadow-[0_4px_14px_rgba(46,91,65,0.25)]">
                Start Application
              </Link>
              <p className="text-[0.8125rem] text-forest/40 mt-4">Takes about 2 minutes. You can log in to check your status once submitted.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="relative group">
          <div className="absolute top-[-2rem] left-[-2rem] font-display text-[9rem] font-bold text-forest/[0.03] leading-none pointer-events-none select-none tracking-[-0.05em] z-0">
            03
          </div>
          <div className="relative z-10">
            <h2 className="font-display font-medium text-[2rem] text-forest mb-8 tracking-tight">Frequently Asked Questions</h2>
            <div className="bg-white border border-forest/10 p-2 shadow-[0_2px_10px_rgba(20,39,24,0.02)] px-8">
              {FAQS.map(faq => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>

        {/* Dark CTA */}
        <div className="bg-forest text-mist p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display font-medium text-[2rem] mb-3 tracking-tight">Still have questions?</h2>
            <p className="text-mist/70 text-[1.0625rem] mb-8 max-w-[42ch] mx-auto">Reach out to our officers directly — we're here to help you get started.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-forest bg-mist hover:bg-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
