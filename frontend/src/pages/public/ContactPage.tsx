import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import EngravedRule from '@/components/landing/ornaments/EngravedRule';
import crestOnDark from '@/assets/images/logo-uswag-on-dark.svg';

const CONTACT_EMAIL = 'uswag.nwssu@gmail.com';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const ref = useRef<HTMLElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  useLandingReveal(ref, [submitted]);

  useEffect(() => {
    if (submitted) doneRef.current?.focus();
  }, [submitted]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // There's no message API yet — hand the message to the visitor's own email app.
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    setSubmitted(true);
  }

  return (
    <PublicPage>
      <PageMasthead
        sectionLabel="Appendix · Contact"
        eyebrow="Reach out"
        title={
          <>
            Write to <em className="text-primary">USWAG.</em>
          </>
        }
        lead="Have a question about membership, our advocacies, or an upcoming event? We’d love to hear from you."
      />

      <section ref={ref} aria-label="Contact USWAG" data-era="present" className="lp-section pt-6" data-lp-era-start data-lp-era-end>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* ---- Letter ---- */}
          <div className="lg:col-span-7">
            <SectionHeading id="contact-form-heading" eyebrow="Send a message" title="Your letter to the officers" />
            {submitted ? (
              <div ref={doneRef} tabIndex={-1} className="lp-card p-8 sm:p-10 mt-10 focus:outline-none" data-lp-reveal>
                <p role="status" className="lp-notice lp-notice--success">
                  Your email app should have opened with your message ready to send. If it didn’t, write to us directly at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="lp-link py-0">{CONTACT_EMAIL}</a>.
                </p>
                <button type="button" onClick={() => setSubmitted(false)} className="lp-btn lp-btn--ghost mt-6">
                  Write another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} aria-labelledby="contact-form-heading" className="lp-card p-6 sm:p-10 mt-10 space-y-6" data-lp-reveal>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-name" className="lp-label">Name</label>
                    <input id="contact-name" type="text" autoComplete="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Juan Dela Cruz" className="lp-input" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="lp-label">Email</label>
                    <input id="contact-email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@nwssu.edu.ph" className="lp-input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="lp-label">Subject</label>
                  <input id="contact-subject" type="text" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="How do I join?" className="lp-input" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="lp-label">Message</label>
                  <textarea id="contact-message" rows={6} required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Write your message here…" className="lp-input" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button type="submit" className="lp-btn lp-btn--primary">
                    Open in my email app <span className="lp-btn__arrow" aria-hidden="true">→</span>
                  </button>
                  <p className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>
                    Or email <a href={`mailto:${CONTACT_EMAIL}`} className="lp-link py-0">{CONTACT_EMAIL}</a>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* ---- Where to find us ---- */}
          <div className="lg:col-span-5 space-y-6 lg:pt-4">
            <div className="lp-vault lp-vault--framed lp-vault--panel lp-on-dark p-8 sm:p-10" data-lp-reveal>
              <img src={crestOnDark} alt="" aria-hidden="true" className="absolute -top-4 -right-4 w-[130px] opacity-[0.08] pointer-events-none select-none" />
              <p className="lp-eyebrow text-sage">Headquarters</p>
              <address className="not-italic font-display text-[1.25rem] leading-[1.5] text-mist mt-4">
                Northwest Samar State University
                <br />
                Main Campus, Rueda Extension
                <br />
                Calbayog City, Samar 6710
              </address>
              <EngravedRule className="mt-7 max-w-[180px] text-sage" reveal={false} />
              <p className="lp-eyebrow text-sage mt-7">Follow the record</p>
              <a
                href="https://www.facebook.com/share/1FkuYoYfnN/"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-link lp-link--light mt-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
                </svg>
                USWAG Official Page
                <span className="lp-sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <figure className="lp-card p-2" data-lp-reveal>
              <iframe
                title="Map of NwSSU Main Campus, Calbayog City"
                src="https://www.openstreetmap.org/export/embed.html?bbox=124.599%2C11.697%2C124.617%2C11.707&layer=mapnik"
                className="w-full h-56 border-0 rounded-[2px]"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 flex items-center justify-between gap-3">
                <span>
                  <span className="block text-[0.9375rem] font-semibold">NwSSU Main Campus</span>
                  <span className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>Calbayog City, Samar</span>
                </span>
                <span className="lp-seal w-9 h-9" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </figcaption>
            </figure>

            <div className="lp-card p-6 flex items-center gap-4" data-lp-reveal>
              <span className="lp-seal w-12 h-12 font-display text-[1.125rem]" aria-hidden="true">AH</span>
              <div>
                <p className="font-display text-[1.125rem] font-medium leading-tight">Arnelyn Heleran</p>
                <p className="lp-eyebrow text-primary mt-1">Faculty Adviser</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
