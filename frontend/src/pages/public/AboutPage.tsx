import OrnamentalDivider from '@/components/common/OrnamentalDivider';
import laurelWreath from '@/assets/icons/laurel-wreath.svg';

export default function AboutPage() {
  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              About USWAG
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Institutional Identity <em className="italic text-sage">&amp;</em> Mission
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[62ch]">
              United Students Working for Advocacy and Growth (USWAG) — a registered student organization at Northwest Samar State University dedicated to sustained, constitutional student advocacy.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[1200px] mx-auto px-8 pt-20">

        {/* Preamble */}
        <div className="bg-white border-l-2 border-sage p-10 md:p-14 mb-20 shadow-[0_8px_24px_rgba(20,39,24,0.04)] relative overflow-hidden group" data-reveal>
          <img
            src={laurelWreath}
            alt=""
            aria-hidden="true"
            className="absolute -top-6 -right-10 w-64 opacity-[0.07] pointer-events-none select-none"
          />
          <div className="relative z-10">
            <h2 className="text-[0.75rem] font-bold tracking-[0.15em] text-primary uppercase mb-5 font-display">The Preamble</h2>
            <OrnamentalDivider variant="primary" className="mb-6" />
            <p className="font-display text-[1.5rem] md:text-[2rem] font-medium leading-[1.5] text-forest italic">
              "We, the student body of Northwest Samar State University, imploring the aid of Almighty God, in order to build a just, humane, and sustainable university environment — to embody our ideals of active participation, mental wellness, and environmental stewardship — do ordain and promulgate this Constitution."
            </p>
          </div>
        </div>

        {/* Article I — Name */}
        <div className="mb-16 max-w-[800px]">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary border border-primary/20 px-3 py-1 rounded-full">Article I</span>
            <h2 className="font-display font-medium text-[1.75rem] text-forest tracking-tight">Name and Principal Office</h2>
          </div>
          <div className="space-y-4 pl-6 border-l border-forest/10">
            <p className="text-forest/70 text-[1.0625rem] leading-[1.75]">
              <strong className="text-forest font-semibold mr-2">Section 1.</strong>
              This organization shall be known as the United Students Working for Advocacy and Growth, hereinafter referred to as USWAG.
            </p>
            <p className="text-forest/70 text-[1.0625rem] leading-[1.75]">
              <strong className="text-forest font-semibold mr-2">Section 2.</strong>
              The principal office of the organization shall be located at Northwest Samar State University (NwSSU), Main Campus, Rueda Extension, Calbayog City, Samar, Philippines.
            </p>
          </div>
        </div>

        {/* Article II — Principles */}
        <div className="mb-20 max-w-[800px]">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[0.6875rem] font-bold tracking-[0.12em] uppercase text-primary border border-primary/20 px-3 py-1 rounded-full">Article II</span>
            <h2 className="font-display font-medium text-[1.75rem] text-forest tracking-tight">Declaration of Principles</h2>
          </div>
          <div className="space-y-4 pl-6 border-l border-forest/10 mb-8">
            <p className="text-forest/70 text-[1.0625rem] leading-[1.75]">
              <strong className="text-forest font-semibold mr-2">Section 1.</strong>
              USWAG believes that students are not merely passive recipients of education, but active stakeholders in the university's governance and future.
            </p>
            <p className="text-forest/70 text-[1.0625rem] leading-[1.75]">
              <strong className="text-forest font-semibold mr-2">Section 2.</strong>
              The organization is anchored on three indissoluble pillars. Every program, fund disbursement, and organizational action must directly serve one or more of these mandates.
            </p>
          </div>

          {/* Pillars visual block */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Youth Voice', desc: 'Active participation in university governance and civic affairs.' },
              { num: '02', title: 'Wellness', desc: 'Mental health literacy and peer support systems.' },
              { num: '03', title: 'Environment', desc: 'Campus sustainability and coastal stewardship.' },
            ].map(p => (
              <div key={p.num} className="bg-white border border-forest/10 p-6 flex flex-col items-start shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
                <span className="font-display text-2xl font-bold text-sage/30 leading-none mb-4">{p.num}</span>
                <h4 className="font-display font-medium text-[1.125rem] text-forest mb-2">{p.title}</h4>
                <p className="text-[0.875rem] text-forest/60 leading-[1.6]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* History / Origin */}
        <div className="mb-24">
          <h2 className="font-display font-medium text-[2rem] text-forest mb-6 tracking-tight">History &amp; Legacy</h2>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-forest/70 text-[1.0625rem] leading-[1.75] mb-5">
                Founded by a coalition of student leaders who recognized that traditional student politics often ended when the elections were over. USWAG was established to be an enduring vehicle for student causes — specifically mental health, environmental action, and continuous civic engagement.
              </p>
              <p className="text-forest/70 text-[1.0625rem] leading-[1.75]">
                By anchoring our purpose in a written Constitution rather than individual personalities, the organization ensures that its programs outlast any single set of officers. We are built on the principle of institutional continuity.
              </p>
            </div>
            
            {/* Adviser Message Block */}
            <div className="bg-primary/5 border border-primary/10 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center font-display font-medium text-[1.25rem] text-primary shadow-sm">
                  AH
                </div>
                <div>
                  <div className="font-display font-medium text-[1.125rem] text-forest">Arnelyn Heleran</div>
                  <div className="text-[0.75rem] text-forest/60 uppercase tracking-widest font-semibold mt-1">Faculty Adviser</div>
                </div>
              </div>
              <p className="font-display italic text-[1.0625rem] text-forest/80 leading-[1.6]">
                "USWAG represents the best of student initiative at NwSSU. They don't just point out problems; they mobilize, build programs, and take responsibility for their campus community."
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
