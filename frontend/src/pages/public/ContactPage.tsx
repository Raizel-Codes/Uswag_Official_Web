import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Graceful fallback: open mailto if API not available
    const mailto = `mailto:uswag.nwssu@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    setSubmitted(true);
  }

  return (
    <div className="w-full bg-mist overflow-x-hidden font-body text-forest pb-24 min-h-screen">

      {/* ===================== HERO ===================== */}
      <section className="relative pt-[clamp(4rem,8vw,6rem)] pb-16 bg-forest text-mist overflow-hidden">
        <div className="absolute top-0 right-[10%] w-[55%] h-[150%] bg-[radial-gradient(ellipse_60%_50%_at_70%_50%,rgba(152,203,176,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-8 relative z-10">
          <div className="max-w-[800px]">
            <div className="flex items-center gap-2.5 font-semibold text-xs uppercase tracking-widest text-sage mb-5">
              <span className="w-6 h-px bg-sage shrink-0" />
              Reach out
            </div>
            <h1 className="font-display font-medium leading-[1.08] mb-6" style={{ fontSize: 'clamp(3rem, 5.5vw, 4.5rem)', letterSpacing: '-0.025em' }}>
              Contact <em className="italic text-sage">USWAG</em>
            </h1>
            <p className="text-mist/70 text-[1.0625rem] leading-[1.75] max-w-[52ch]">
              Have a question about membership, our advocacies, or an upcoming event? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-forest/15 via-transparent to-transparent w-full" />

      {/* ===================== CONTENT ===================== */}
      <div className="max-w-[1200px] mx-auto px-8 pt-16">
        <div className="grid lg:grid-cols-[6fr_4fr] gap-12 lg:gap-20 items-start">

          {/* Contact form */}
          <div>
            <h2 className="font-display font-medium text-[2rem] text-forest mb-8 tracking-tight">Send a Message</h2>
            {submitted ? (
              <div className="bg-white border border-forest/10 p-12 text-center shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display font-medium text-[1.5rem] text-forest mb-2">Message sent!</h3>
                <p className="text-[0.9375rem] text-forest/70 mb-8">Your email client should have opened. We'll get back to you soon.</p>
                <button onClick={() => setSubmitted(false)} className="inline-flex items-center gap-2 px-[1.875rem] py-[0.875rem] font-sans text-[0.875rem] font-semibold text-forest bg-mist hover:bg-white border border-forest/10 transition-colors">
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[0.6875rem] font-bold text-forest uppercase tracking-[0.12em] mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-white border border-forest/15 rounded-none px-4 py-3.5 text-[0.9375rem] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-forest/30"
                      placeholder="Juan dela Cruz"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-bold text-forest uppercase tracking-[0.12em] mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-white border border-forest/15 rounded-none px-4 py-3.5 text-[0.9375rem] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-forest/30"
                      placeholder="juan@student.nwssu.edu.ph"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[0.6875rem] font-bold text-forest uppercase tracking-[0.12em] mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-white border border-forest/15 rounded-none px-4 py-3.5 text-[0.9375rem] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder-forest/30"
                    placeholder="How to join?"
                  />
                </div>
                <div>
                  <label className="block text-[0.6875rem] font-bold text-forest uppercase tracking-[0.12em] mb-2">Message</label>
                  <textarea
                    rows={6}
                    required
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-white border border-forest/15 rounded-none px-4 py-3.5 text-[0.9375rem] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-none placeholder-forest/30"
                    placeholder="Write your message here..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-[2.5rem] py-[1rem] font-sans text-[0.9375rem] font-semibold text-white bg-forest hover:bg-primary transition-colors shadow-[0_4px_14px_rgba(46,91,65,0.15)]"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-8">

            {/* HQ card */}
            <div className="bg-[#142718] p-10 text-mist relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(152,203,176,0.1),transparent_70%)] pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-display font-medium text-[1.5rem] mb-4">Headquarters</h3>
                <p className="text-[0.9375rem] text-mist/70 leading-[1.75] mb-8">
                  Northwest Samar State University (NwSSU)<br />
                  Main Campus, Rueda Extension<br />
                  Calbayog City, Samar 6710
                </p>
                <div className="h-px bg-gradient-to-r from-sage/30 to-transparent w-full mb-8" />
                <h3 className="font-display font-medium text-[1.25rem] mb-4">Social Media</h3>
                <a href="https://www.facebook.com/share/1FkuYoYfnN/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-[0.9375rem] font-medium text-sage hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
                  </svg>
                  USWAG Official Page
                </a>
              </div>
            </div>

            {/* Map embed */}
            <div className="bg-white border border-forest/10 p-2 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
              <iframe
                title="NwSSU Campus Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=124.599%2C11.697%2C124.617%2C11.707&layer=mapnik"
                className="w-full h-48 border-0"
                loading="lazy"
              />
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.875rem] font-bold text-forest">NwSSU Main Campus</p>
                  <p className="text-[0.75rem] text-forest/60">Calbayog City, Samar</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-forest">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Adviser card */}
            <div className="bg-white border border-forest/10 p-6 shadow-[0_2px_10px_rgba(20,39,24,0.02)]">
              <h3 className="font-display font-medium text-[1.125rem] text-forest mb-4 border-b border-forest/10 pb-2">Adviser Information</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 flex items-center justify-center text-primary font-medium font-display text-[1.25rem] shrink-0 border border-forest/10">
                  AH
                </div>
                <div>
                  <div className="text-[0.9375rem] font-bold text-forest">Arnelyn Heleran</div>
                  <div className="text-[0.75rem] text-forest/60 uppercase tracking-widest mt-0.5">Faculty Adviser</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
