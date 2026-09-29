# Landing page architecture: "From the Record to the Present"

Status: **APPROVED 2026-09-28.** Resolved decisions:
- **D1:** name is "United Students".
- **D2:** founded **2010**. The remaining milestones are placeholders pending the adviser's confirmation.
- **D5:** Lora + Inter only.
- **D6:** the new folders are approved.
- **D7:** show live counts only (current officers, upcoming events).
Inputs: `reference-audit.md`, `current-state.md`, the brief (2026-09-28) and `CLAUDE.md`.

---

## 0. Decisions needed before implementation

| # | Question | My recommendation |
|---|---|---|
| D1 | Org name: "**United Students**" (Constitution, CLAUDE.md, site) or "**Unified Student**" (brief, unused gold SVG)? | Use **United Students**, since the Constitution is the source of truth, unless an amendment changed it. |
| D2 | Founding year and real milestones for the timeline (≥3 dated events, e.g. founding, first adviser, notable campaigns, dormancy, revival, first digital membership). | You supply them. Until then the timeline section **does not render** (see §2, S3). I won't invent history. |
| D3 | ✅ **Resolved 2026-09-28:** `prototype/landingDesktop.html` is **outdated** and does **not** govern `/`. This brief and this doc are the reference for the landing page. | n/a |
| D4 | ✅ **Resolved 2026-09-28:** `public/images/hero-cover.jpg` **is the USWAG logo** (the graffiti wordmark). | It gets featured in S2 as the heritage mark, shown as a sepia archival artifact with alt text "The USWAG graffiti-style wordmark". It is no longer used as the hero "photo". |
| D5 | Fonts: stay **Lora + Inter only** (CLAUDE.md pairing), or add a landing-only archival face? | **Lora + Inter only.** The classical layer comes from Lora italics, tracked capitals and old-style figures. There is no new font request and no pairing change. |
| D6 | New folders `frontend/src/components/landing/` and `frontend/src/styles/landing.css` are not in `filestructure.txt` §2. | Approve both. `landing/` sits alongside `feed/`, `qr/` and `pwa/`. |
| D7 | Hero stat numbers: live figures or none? No public member-count endpoint exists. | Show only numbers derivable from existing public queries (current officer count, upcoming events), or drop the stat row. There will be no fake "486". |
| D8 | ✅ **Resolved 2026-09-28:** repo `github.com/Raizel-Codes/Uswag_Official_Web`, branch `main`. Commits are authored as contributor CodeForChange853. The baseline snapshot is `e2e82a9`. | n/a |

---

## 1. Design tokens (landing-scoped)

All new tokens go in **`frontend/src/styles/landing.css`**. It is imported only by `HomePage.tsx`, so it lands in the lazy route chunk, and every rule is scoped under `.lp` (the page root class).

The reason for scoping: Vite keeps a route chunk's CSS in the document after navigation, so unscoped rules would leak into the portals. `tokens.css`, `tailwind.config.js` and `index.css` are **not modified**.

### 1.1 Color: the era palette
The brand four stay authoritative and are referenced through the existing `--color-*` variables. New colors are **supporting tones only** and are prefixed `--lp-`.

```css
.lp {
  /* PAST: supporting tones, warm parchment tinted toward Mist; Deep Forest is the ink */
  --lp-parchment:      #EFEADA; /* past page surface (Mist's warm sibling) */
  --lp-parchment-deep: #E4DCC6; /* aged cards, clippings, flyer stock */
  --lp-sepia:          #7A6242; /* engraved rules, ornaments, captions ≥14px */
  --lp-sepia-ink:      #5A4832; /* secondary text on parchment */
  --lp-foxing:         #C9B48F; /* age stains, halftone dots: DECORATIVE ONLY */
  --lp-ink:            var(--color-deep);

  /* PRESENT: the brand, full strength */
  --lp-surface-now:    var(--color-mist);
  --lp-surface-dark:   var(--color-deep);

  /* ERA: 0 = past, 1 = present; scrubbed by scroll (see §3) */
  --lp-era: 0;
  --lp-bg: color-mix(in oklab, var(--lp-parchment), var(--color-mist) calc(var(--lp-era) * 100%));
  --lp-grain-opacity: calc(0.10 * (1 - var(--lp-era)));
}
```

**Contrast of every text pairing on the landing page (computed, WCAG 2.x):**

| Text / surface | Ratio | Allowed use |
|---|---|---|
| Deep Forest / Parchment | 13.09 | All text |
| Deep Forest / Parchment-deep | 11.52 | All text |
| Deep Forest / Mist | 13.40 | All text |
| Primary / Parchment | 6.49 | Links, buttons, headings |
| Primary / Mist | 6.64 | Links, buttons, headings |
| Sepia-ink / Parchment | 7.25 | Body and secondary text |
| Sepia-ink / Parchment-deep | 6.38 | Body and secondary text |
| Sepia / Parchment | 4.78 | Captions and meta (≥ 14px) |
| Sepia / Parchment-deep | **4.20** | ⚠️ Large text (≥ 24px) and non-text only |
| Mist / Deep Forest | 13.40 | All text |
| Sage / Deep Forest | 8.63 | Eyebrows, accents, focus ring on dark |
| White / Primary | 7.81 | Button labels |
| Mist / Primary | 6.64 | Text on the Join panel |
| **Sage / Primary** | **4.28** | ❌ Not for text under 24px (the current Join eyebrow fails; it will be changed to Mist) |
| **Sage / Mist, Sage / Parchment** | **1.55 / 1.52** | ❌ Never text. Hairlines, badges and fills only. |
| **Foxing / Parchment** | 1.68 | ❌ Decoration only |
| `text-forest/60` on Mist (current) | 4.03 | ❌ Replaced by `forest/75` (≈ 6.1) for small text |

### 1.2 Type scale (Lora = display, Inter = body; D5)
| Token | Face | Size | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `--lp-t-masthead` | Lora 600, uppercase | clamp(0.8125rem, 1vw, 0.9375rem) | 1 | 0.32em | "THE USWAG RECORD" nameplate and datelines |
| `--lp-t-display` | Lora 500 | clamp(2.75rem, 6.2vw, 5.75rem) | 1.02 | -0.02em | H1 |
| `--lp-t-h2` | Lora 500 | clamp(2rem, 3.8vw, 3.5rem) | 1.08 | -0.015em | Section headings |
| `--lp-t-h3` | Lora 600 | 1.375rem | 1.25 | 0 | Card and timeline titles |
| `--lp-t-dateline` | Lora italic 400 | 1.125rem | 1.5 | 0 | Pull quotes, the "Vol. I" line |
| `--lp-t-eyebrow` | Inter 600, uppercase | 0.75rem | 1.2 | 0.16em | Section eyebrows, accession labels |
| `--lp-t-body` | Inter 400 | 1.0625rem | 1.7 | 0 | Paragraphs (max 62ch) |
| `--lp-t-small` | Inter 500 | 0.875rem | 1.55 | 0.01em | Meta. **12px is the floor**, nothing smaller |
| Numerals | Lora | n/a | n/a | n/a | `font-variant-numeric: oldstyle-nums` in past sections, `lining-nums tabular-nums` in present sections. The figures themselves "modernize". |

This follows the reference principle: size contrast only at the top of the scale, with tracked capitals doing the archival labelling. Weights stay at 400/500/600.

### 1.3 Spacing and layout
- Section padding: `--lp-section-y: clamp(5rem, 10vw, 9.5rem)`. Past sections get about 15% more air than present ones (the pacing tightens as we arrive in the present).
- Containers: `--lp-measure: 62ch` (reading), `--lp-content: 1200px` (matches the site), `--lp-wide: 1320px` (timeline and card stage).
- Grid: 12 columns, 24px gutter on desktop; 16px side gutter with a single column on mobile.
- Radius: past = `0` (paper has square corners); present = the site's existing `12px` (`--r-md`). The rebirth card's radius animates between them.

### 1.4 Motion tokens
```css
.lp {
  --lp-ease:        cubic-bezier(0.22, 1, 0.36, 1);  /* house curve: reveals, hovers, wipes */
  --lp-ease-press:  cubic-bezier(0.2, 0, 0, 1);      /* press/focus micro-interactions */
  --lp-dur-micro:   180ms;  /* press, focus ring */
  --lp-dur-ui:      420ms;  /* hover, underline draw, button wipe */
  --lp-dur-story:   850ms;  /* scroll reveals, sepia→color */
  --lp-stagger:     70ms;
  --lp-rise:        24px;   /* reveal distance (16px on mobile) */
}
```
GSAP equivalents are added to `lib/motion.ts` as new keys only (`EASE.house = 'expo.out'`, `DURATION.story = 0.85`). The existing keys are unchanged, so current consumers behave exactly as before.

---

## 2. Narrative structure (section order)

The page reads like a bound archive whose pages grow crisper as you scroll, and it ends in the digital present.

| # | Section | Era | Surface | Core idea |
|---|---|---|---|---|
| **S1** | **Archival hero: "The Record"** | 0 | Parchment with grain and vignette | A broadsheet front page. Nameplate: "THE USWAG RECORD · VOL. I · EST. [D2] · NORTHWEST SAMAR STATE UNIVERSITY". The H1 is set like a headline. There is an engraved single-ink crest, a lead paragraph, two CTAs, and a newspaper-clipping composition (HTML/CSS/SVG) on the right with a halftone illustration. The LCP element is the H1 text, not an image. |
| **S2** | **Origin: "Where it began"** | 0 → 0.15 | Parchment | The Constitution **Preamble** (real text), typeset with a drop cap and ruled margins like a founding document. Next to it is a founding-era **flyer** mockup and, if D4 allows, the earlier graffiti mark as a sepia clipping. |
| **S3** | **The years in between** | 0.15 → 0.6 | Parchment → Mist blend | A vertical ledger timeline (`<ol>`). The year markers use old-style numerals and the spine line changes from sepia to primary as you scroll. **It only renders entries you have verified (D2).** With fewer than 3 entries, it collapses to a single short "a decade of continuity" paragraph and the timeline is not shown. |
| **S3.5** | **Interlude: "Before the rebirth"** (added 2026-09-30) | 0, until committed | Parchment | "The Rebirth of USWAG", a 90-second film in two parts in a full-width theatre. Forest-green velvet parts as the theatre scrolls in; a quill-signature button starts the film. At the intermission the velvet closes, the page commits to the present, and digital shutters open on Part Two. The film is code (Remotion + GSAP), not a video file. See §3.6. |
| **S4** | **The rebirth** | 0.6 → 1 | Mist, with Deep Forest arriving | The hinge of the page. A **membership card** starts as a typewritten sepia paper card (square corners, foxing, a rubber-stamp "MEMBER") and, as you scroll, **resolves into the digital QR card**: a Deep Forest face, a sage QR frame and 12px radius. The engraved crest crossfades into the green `logo-uswag-on-dark` crest. Copy: "Reborn for the digital era", explaining the signed-QR membership and the PWA. |
| **S5** | **Programs & impact** | 1 | Deep Forest (mandates), then Mist (pulse) | The three constitutional mandates (existing content, restyled and re-tokenized). A condensed "Today's stewards" officer row (live data, linking to `/officers`). The live **Pulse**: events plus synced Facebook posts (existing queries). |
| **S6** | **Call to action** | 1 | Primary panel on Mist | "Write the next chapter." Join CTA plus a secondary "Read the Constitution" link (`/bylaws`). The existing mobile sticky bar is re-tokenized (no `bg-white`) and its safe-area bug is fixed. |

The Footer (shared, Deep Forest) closes the page in the present, so no change is needed.

**Header decision (no shared change needed):** the existing Header is transparent with Deep Forest text at the top (13:1 on parchment) and switches to `mist/85` with blur after 24px. That already works over both eras, so `Header.tsx` is **not modified**. I'm not adding a skip link here because it would have to live in the shared `PublicLayout`. It is listed as an optional follow-up.

---

## 3. Motion language

### 3.1 The era scrub (the one signature effect)
- One ScrollTrigger spans from the top of S2 to the middle of S4 with `scrub: 0.6`. It writes `--lp-era` (0→1) onto a **single fixed `.lp-atmosphere` layer** behind the content.
- That layer holds the background color (`--lp-bg`), a paper-grain tile (opacity follows the era) and a soft sepia vignette (opacity follows the era).
- Only this one element repaints its background color. Grain and vignette are separate layers animated by **opacity only**, which runs on the compositor.
- **No pinning.** `HomePage.tsx:78-86` records that a GSAP pin fought the fixed Header. Every effect is a plain scroll-linked tween.
- Fallback when `color-mix()` is unsupported: the layer steps between parchment and mist through a `@supports` block.

### 3.2 Reveals
- A single upward move plus fade: `y: var(--lp-rise) → 0`, `opacity 0 → 1`, `--lp-dur-story`, house ease, **70ms stagger**. They trigger at `top 85%` and play once.
- Order inside every section is eyebrow, then heading, then ornament rule (draws from the center outward with `scaleX`), then body, then media.
- In past sections, images and compositions reveal **sepia first**, then desaturate toward full brand color over 850ms once in view. The reference's "sepia at rest" idea is applied to time rather than hover.
- There is no horizontal motion, no rotation and no infinite ambient loops anywhere on the page.

### 3.3 The rebirth card (S4)
- A scroll-linked tween on the card stack across about 60vh: the sepia face goes from `clip-path: inset(0 0 0 0)` to `inset(0 0 100% 0)`, wiping upward to reveal the digital face underneath. The radius goes from 0 to 12px and the shadow warms to green.
- It is a single element pair, and transform, opacity and clip-path are on a promoted layer.

### 3.4 Hover and focus
| Element | Rest → hover/focus | Timing |
|---|---|---|
| Primary button | A Deep Forest fill wipes left to right over Primary (`::before scaleX 0→1`, origin left) and the label stays white | `--lp-dur-ui`, house ease |
| Ghost button | The border goes from `forest/25` to `forest`, and the background gains a faint parchment/mist wash | `--lp-dur-ui` |
| Button press | `translateY(1px) scale(.985)` | `--lp-dur-micro`, press ease |
| Text link | A 1px underline draws from the left (`scaleX`), and the color goes from Primary to Deep Forest | `--lp-dur-ui` |
| Archival artifacts (clipping, flyer, photo slots) | `filter: sepia(.6)` → `sepia(0)` and lift 2px, triggered on **hover and `:focus-within`** | 850ms / 420ms |
| Cards (present) | Lift 2px plus a `0 10px 28px rgb(20 39 24 / .10)` shadow | `--lp-dur-ui` |
| Focus ring | `outline: 2px solid var(--color-primary); outline-offset: 3px` on light surfaces, and `var(--color-sage)` on Deep Forest. Always `:focus-visible` and never removed. | instant |

### 3.5 `prefers-reduced-motion: reduce`
- `--lp-era` isn't scrubbed. Each section gets its own **static era surface** (S1–S2 parchment, S3 half-blend, S4 onward mist/deep). The time journey still reads, in steps.
- All reveals are skipped and content renders in its final state (matching the existing `index.css` rule).
- The rebirth card shows **both faces side by side** labelled "Then" and "Now" instead of the wipe.
- Hover color and underline changes stay. Lifts, wipes and filter transitions become instant.
- Grain stays static, and CountUp shows the final value (it already does).
- The prequel's curtains fade instead of gathering, and the signature appears without the writing hand. The page does not jump to Mist at the intermission; each section keeps its static surface.

### 3.6 The prequel theatre (S3.5) — added 2026-09-30, extended to 1:30 the same day
Decisions confirmed by the organisation on 2026-09-30:
- **The page turns modern whether or not the film is watched.** Scroll drives it for visitors who skip the film; the film's intermission drives it for those who watch.
- **The adviser-founder reveal is confirmed.** The adviser agreed to be depicted, in silhouette and unnamed.
- **The velvet is forest green, not red.** Red isn't in the palette.
- **The film is coded, not rendered to MP4.** It is a Remotion composition choreographed with GSAP, and it stays click-to-play: it is not scrubbed by scroll, so it can carry a score and keep its pacing.
- **One 1:30 film in two parts** — the prequel (the record, 2010 → 2025) and its sequel (the record, live) — with an intermission between them.
- **Full-width curtains that part once on entry**, after the curtain past the hero on therecord.institute (two half-width panels with gilt edges, opening over ~1.8s with a fast-out, slow-settle curve), in the landing palette.
- **The play button is a signing:** a quill signs "USWAG", a green seal comes down, and the film opens out of the seal.

How it works:
- **The theatre (`PrequelSection`, `CinemaCurtains`, `SignaturePlay`).**
  - A full-bleed band under the section heading: a pleated velvet pelmet with a gilt braid, a 16:9 screen sized to fit the viewport, and an apron. `--screen-w` and `--wing` (the space each side of the screen) are computed in container units.
  - The velvet drapes cover the whole band. When the band's top passes 70% of the viewport they gather to the wings (their `width` transitions to `--wing`, so the pleats bunch rather than slide). Scrolling back above it closes them and resets the film.
  - Behind them the screen shows the signature card: "Sign the record to begin", the title, and a signature line with a resting quill ("Watch the prequel · 1:30"). Pressed, the film starts from that same click (iOS only lets a gesture start audio); the quill writes the signature along its own stroke (GSAP MotionPath); the seal lands; and a radial mask opens from the seal onto the film, whose first two seconds are a dark projector warm-up. If the film's code hasn't arrived yet, the ritual holds at the seal ("Loading the prequel…").
- **The stage follows the film's frame** (`prequel.data.ts` → `MARKS`, `stageAt`):
  - 0:57 — the velvet closes over the end of Part One; its hanging card reads "Intermission".
  - 0:58 — behind it the page commits to the present (`useLandingEra`); the pelmet and screen trim turn sage.
  - 0:58.8 — digital shutters fold across the velvet; unseen behind them, the velvet returns to the wings with a digital face.
  - 1:00 — the shutters open on Part Two.
  - 1:28 — the shutters close for the finale; focus moves to "Continue to the rebirth". "Watch again" replays with the signing, and the page returns to parchment for Part One.
  - "Skip to Part Two" jumps to 1:00 while Part One is playing.
- **The era has two inputs, and the page shows whichever is further along:** the scroll scrub (from `#lp-rebirth`) and the commit (`useEraScroll` → `EraControls`, via `LandingEraContext`). Scrolling back above the theatre releases the commit.
- **The film (`components/landing/prequel/`):** `PrequelFilm.tsx`, 1920 × 1080, 30 fps, 2700 frames; scene frames are in `SCENES`.
  - Part One plays in a 1440 × 1080 (4:3) gate on parchment with grain, vignette, seeded flicker and gate weave, iris cuts (`Iris`) and light leaks (`LightLeak`):
    - Prologue: lamp, countdown, title card.
    - Act I, The Founding: a multi-plane dawn over the arch (sky, hills, arch and grass move at different rates); the quill signs the charter; the stamp shakes the frame.
    - Act II, The Quiet Years: a time-lapse of days and rain; the founders drift apart; the charter ages as grass creeps in.
    - Act III, The Return: the charter restored; a new generation; focus racks to the adviser; the quill crosses the split; a new student countersigns and a green stamp comes down.
    - Act IV, The Turning: the stamp's ink breaks into QR-like modules and the page into a grid; the frame opens to 16:9; the card and the three advocacies.
  - Part Two plays on Deep Forest with the sage grid:
    - Reach: a notification from the officers; phones light up across the campus.
    - Connect: a post on the Facebook Page, carried by the sync into the site's feed; an RSVP.
    - The Three Pillars: Article II's advocacies; a QR check-in at the seedling.
    - The Years Ahead: tree rings for 2010, the quiet years, each year since 2025 (solid) and the years ahead (dashed); then the name.
  - **Remotion owns the clock; GSAP only describes the motion.** Each scene builds a paused GSAP timeline that `useFilmTimeline` seeks to the current frame on every render. Captions, fades, dust, the iris and the time-lapse sky are pure functions of the frame.
  - GSAP's SVG transform-origin maths misplaced SVG shapes that start from `scale: 0` inside the Player, so the rings grow by their `r` attribute and the QR modules fade in instead.
  - **Compact mode:** below a 640px screen the film sets captions and titles larger (about 12–16px on screen) and drops small print (the text inside the phone, post and pillar illustrations).
- **What Part Two may show:** only what the site does — push notifications, the read-only Facebook Page sync, RSVP, signed-QR check-in — with generic text ("A new announcement from your officers") and placeholder lines. No invented events, dates or numbers. The QR patterns are decorative, never real codes.
- **Player (`PrequelPlayer`, `usePrequelPlayer`):** `@remotion/player` with no built-in controls, loaded in its own chunk (about 101 kB gzipped) when the theatre comes within 800px. States: idle → (loading) → playing ⇄ paused → closing → ended, plus error. It pauses when less than 25% of the theatre is on screen or the tab is hidden, and never resumes by itself. The chunk is left out of the service-worker precache (it's cached on first use), so visitors who never reach the film never download it.
- **Scene mounts (measured 2026-09-30, production build, desktop):** frames take roughly 4–10 ms, against a 33 ms budget at 30 fps. Mounting a scene is the expensive part: about 100 ms for Act IV and 50 ms for Reach. Part One's cuts hide that under an iris or a light leak. Act IV and Reach are premounted (`premountFor` in `PrequelFilm`) while the viewer can't see: the closed iris at frame 950, and the closed velvet and shutters at frame 1775. That brings their on-screen cuts to about 20–25 ms. Keep new scenes' cuts under a transition, or premount them the same way.
- **No pinning, no scroll lock, no autoplay.** "Skip to the rebirth" is always present, and the controls (with a two-part progress bar) sit under the picture.
- **Accessibility:** the film layer is `aria-hidden`. The page used to carry a full "Read the story" transcript; the organisation removed it on 2026-09-30 because its scene-by-scene wording read like production notes and shouldn’t be public. It was replaced the same day by a short plain-language summary in the figure’s screen-reader-only `<figcaption>` (the WCAG 1.2.3 alternative) — keep it plain public copy, and update it if the film’s story changes. A polite live region announces status and the intermission. The signature is a real `<button>` named "Watch the prequel, 1 minute 30 seconds". Under reduced motion the curtains fade, the signature appears without the writing hand, and the card fades to the film.
- **Sound:** optional. `VITE_PREQUEL_MUSIC_URL` (a licensed 90-second track) adds a score and a mute button. Without it the film is silent and the stage says "No sound".
- **Licence:** Remotion is source-available, not MIT. It is free for individuals, non-profits and companies of up to 3 people. Once the organisation has confirmed it qualifies, pass `acknowledgeRemotionLicense` to the Player.
- **Storyboard and copy:** `components/landing/prequel.data.ts`. Act II gives no years or causes for the break-up; none are on record. The adviser should approve Part Two's script.
- **New landing tones:** `--lp-gilt` (decorative only) and `--lp-gilt-light` (text on Deep Forest only), in the `.lp` block of `landing.css` with the other `--lp-*` tones.

---

## 4. Components and file structure

```
frontend/src/
├── pages/public/HomePage.tsx               CHANGED: becomes a thin composition of sections
├── styles/landing.css                      NEW (D6): .lp-scoped tokens, textures, hover/focus
├── lib/motion.ts                           CHANGED: additive keys only (EASE.house, DURATION.story)
├── hooks/useEraScroll.ts                   NEW: drives --lp-era on .lp-atmosphere (reduced-motion aware)
└── components/landing/                     NEW (D6)
    ├── LandingAtmosphere.tsx               fixed background layer: era color, grain, vignette
    ├── sections/
    │   ├── ArchivalHero.tsx                S1
    │   ├── OriginSection.tsx               S2
    │   ├── YearsTimeline.tsx               S3 (renders only verified entries)
    │   ├── RebirthSection.tsx              S4
    │   ├── ImpactSection.tsx               S5 (mandates, stewards, pulse)
    │   └── LandingCTA.tsx                  S6 (+ MobileStickyBar, moved out of HomePage)
    ├── artifacts/                          code-generated "mockups"
    │   ├── NewspaperClipping.tsx           deckled clipping, halftone illustration, column rules
    │   ├── FoundingFlyer.tsx               letterpress-style flyer, border, ornaments
    │   ├── MembershipCardMorph.tsx         sepia paper card ⇄ digital QR card (decorative QR, aria-hidden)
    │   └── EngravedCrest.tsx               single-ink hatched crest (same geometry as logo-uswag.svg)
    ├── ornaments/
    │   ├── EngravedRule.tsx                double rule + diamond, draws on reveal
    │   ├── VintageBorder.tsx               printer's border frame (SVG pattern)
    │   └── RubberStamp.tsx                 "EST. ____" / "MEMBER" stamp (SVG, slightly rotated, fixed)
    ├── EraSection.tsx                      section wrapper: era surface for reduced motion, reveal scope
    └── timeline.data.ts                    typed, verified milestones only (empty until D2)
frontend/src/types/landing.types.ts         NEW: TimelineEntry, EraValue
frontend/public/assets/placeholders/        NEW: ASSETS.md + placeholder SVGs (see §5)
docs/design/*.md                            these docs
```

**Existing files that change:**
- `HomePage.tsx`
- `lib/motion.ts` (additive)
- `CornerFrame.tsx` and `OrnamentalDivider.tsx`: an optional `color` prop so the hardcoded hex can be replaced by a CSS variable. The defaults are unchanged, so About, Officers and the other pages render identically.

**Explicitly not touched:** `tokens.css`, `tailwind.config.js`, `index.css`, `index.html`, `Header`, `Footer`, `PublicLayout`, everything under `pages/member`, `pages/admin`, the portal layouts and the PWA shell and icons.

**Defect fixes that come with the rebuild (all inside HomePage's scope):**
- Remove the hardcoded hex and `bg-white`.
- Replace `text-gray-400` empty states.
- Fix the invalid Tailwind stroke and duration classes.
- Correct the hero image alt text or remove the image (D4).
- Remove the fake stats (D7).
- Fix the sticky bar's padding bug.
- Replace the Facebook blue link text (3.6:1) with Primary text plus the FB glyph.

---

## 5. Asset list

### 5.1 Code-generated (shipped; original; nothing traced from the reference)
| Asset | Technique | Where |
|---|---|---|
| Paper grain | 256px `feTurbulence` SVG data URI tile at about 10% opacity | Atmosphere layer |
| Halftone | `radial-gradient` dot pattern with a `mask-image` | Clipping illustration, S1 |
| Aging and foxing | Two or three blurred radial gradients in `--lp-foxing` at low alpha | Clipping, flyer, paper card |
| Deckle and torn edge | An SVG `clip-path` polygon (fixed, not random, so SSR and layout stay stable) | Clipping and flyer edges |
| Engraved crest | The `logo-uswag.svg` geometry redrawn in single-ink Deep Forest with hatch `<pattern>` fills | S1, and S4 before the crossfade |
| Vintage border | SVG `<pattern>` printer's-flower border | Flyer |
| Engraved rule and ornament | SVG, extending the `OrnamentalDivider` vocabulary | Section openers |
| Rubber stamp | SVG text on a path with a roughened stroke via a light `feTurbulence` displacement, static | Paper card, flyer |
| Timeline spine and markers | SVG line whose stroke color follows the era, plus diamond markers | S3 |
| Decorative QR | A generated **non-functional** pattern, `aria-hidden`, labelled as illustrative | Digital card face |
| Halftone illustration | Abstract SVG scenes (campus arch, raised hands, leaf), all original | Clipping and flyer |

### 5.2 Photo placeholders: `frontend/public/assets/placeholders/`
These are lightweight labelled SVG placeholders plus `ASSETS.md` (filename, target dimensions, subject, style notes, generation prompt). They are **not rendered in production** until replaced. Components take an optional `photo` prop and fall back to the code-generated composition, so no placeholder art reaches visitors.

| File | Dimensions | Subject | Style |
|---|---|---|---|
| `archive-founding-group.webp` | 1600×1067 | Founding members group photo (real archive scan preferred) | Real scan; displayed through the sepia filter |
| `archive-early-event.webp` | 1200×900 | An early USWAG assembly or outreach | Same |
| `archive-flyer-scan.webp` | 900×1273 | An original printed flyer, if one exists | Scan at 300dpi, then WebP |
| `present-campus-today.webp` | 1600×1000 | Today's members on the NwSSU campus | Natural light, color, candid |
| `present-member-scan.webp` | 1200×900 | An officer scanning a member QR at an event | Close-up with shallow depth of field |

AVIF variants are generated alongside the WebP files, with `loading="lazy"`, explicit `width`/`height` and `decoding="async"`. Real photos of real people need **consent from the people pictured**. That will be noted in `ASSETS.md`.

---

## 6. Performance and accessibility budget

### Performance (mid-range Android, Slow 4G profile)
| Metric | Budget |
|---|---|
| LCP | ≤ 2.5s. The LCP element is the S1 H1 text, and no image blocks it. |
| CLS | ≤ 0.05. All media has fixed dimensions and artifacts use fixed aspect ratios. |
| INP | ≤ 200ms |
| Added landing JS (gz) | ≤ 15 KB over today. GSAP is already in the chunk, and **no new dependencies**. |
| Added landing CSS (gz) | ≤ 8 KB |
| Fonts | **No new font files** (D5) |
| Images above the fold | 0 raster |
| Total raster on `/` | ≤ 250 KB until real photos exist, ≤ 600 KB after |
| ScrollTriggers | ≤ 20 instances, refreshed on data and fonts (existing pattern) |
| Animated properties | transform, opacity and clip-path, plus **one** background-color repaint layer |
| Below the fold | `content-visibility: auto` with `contain-intrinsic-size` on S3–S5 |
| Infinite animations | None |

### Accessibility (WCAG 2.2 AA)
- One `<h1>` and a logical heading order. Every section is a `<section aria-labelledby>`. The timeline is an `<ol>` with `<time datetime>`.
- All text pairings come from the table in §1.1. There are no alpha-reduced text colors below 4.5:1, and 12px is the minimum size.
- Artifacts are **decorative** (`aria-hidden`) wherever their text is repeated in real HTML. The membership card's meaning is stated in the adjacent copy.
- Keyboard: every interactive element has a visible `:focus-visible` ring (§3.4), hover-only affordances are mirrored on `:focus-within`, and the tab order follows the visual order.
- `prefers-reduced-motion` has full parity (§3.5), and nothing essential depends on motion.
- There is no content in `::before`/`::after` that screen readers need.
- Images that carry meaning get honest alt text. Decorative ones get `alt=""`.
- Shared-scope issues flagged here were fixed since: `PublicLayout` has a skip link, footer text is at 80–85% alpha, and `index.html` no longer sets `maximum-scale` (2026-09-30).

---

## 7. Build sequence (Phase 4, after approval)
Each step is a separate commit.
1. `git init` and a snapshot of the current state (D8).
2. `landing.css` tokens, `LandingAtmosphere` and `useEraScroll`, with an empty section shell. Verify the portals are unchanged.
3. Ornaments and the `EngravedCrest`.
4. S1 hero and `NewspaperClipping`.
5. S2 origin and `FoundingFlyer`.
6. S3 timeline, data-driven and hidden until D2 entries exist.
7. S4 rebirth and `MembershipCardMorph`.
8. S5 impact (port the existing mandates, stewards and pulse, re-tokenized, with defect fixes).
9. S6 CTA and the mobile sticky bar.
10. Placeholders and `ASSETS.md`.
11. Reduced-motion pass, contrast pass, and Lighthouse and axe runs.
12. Chrome verification: desktop at 1440 and 1280, mobile at 390 and 360. Check animation smoothness in a performance trace, and compare portal screenshots before and after (member, officer-admin and super-admin dashboards).

---

## 8. Implementation notes (Phase 4, 2026-09-28)

What was built differs from the plan above in a few places:

| Plan | As built | Why |
|---|---|---|
| Fixed `LandingAtmosphere` layer carrying `--lp-era` | `useEraScroll` tweens `background-color` on the `.lp` root directly (parchment to Mist) | A fixed layer inside the page paints *over* the shared Footer, because positioned content paints after non-positioned siblings. Tweening a concrete color instead of an inherited custom property also avoids restyling the whole subtree every frame. |
| Grain and vignette opacity tied to the era | Grain sits on past sections as a static texture. The timeline's grain fades out down the section through a mask. The vignette is on the side edges only. | No per-frame work, and no visible seams between sections. |
| `EraSection.tsx` wrapper | Not needed. Each section is a plain `<section class="lp-section" data-era>` and calls `useLandingReveal` on its own ref. | Scoping reveals per section means live data only re-scans its own subtree, so the hero doesn't flicker when queries resolve. |
| `CornerFrame` / `OrnamentalDivider` gain a `color` prop | **Not modified.** The landing page uses its own `EngravedRule`. | Zero risk to the other public pages. |
| `content-visibility: auto` on S3–S5 | Not used | Placeholder sizing shifts ScrollTrigger measurements. |
| ≤ 20 ScrollTriggers | 43 (one per revealed element, via `ScrollTrigger.batch`) | Within normal limits for GSAP. Could be cut to about 10 per-section triggers if profiling ever shows a cost. |

Other implementation details:
- Base typography and section classes in `landing.css` use `.lp :where(.x)` / `:where(.lp .x)`. Tailwind utilities on the same element can override them, but they still beat Tailwind's preflight element resets.
- Landing CSS ships only in `HomePage-*.css` (3.1 KB gz). The shared `index-*.css` gained utilities and lost only utilities that the old HomePage alone used. No shared rule changed.

### Verification (Chrome, localhost)
- **Desktop at 1568px:** all six sections render. The parchment-to-Mist scrub, timeline spine fill and card morph all run.
- **Mobile at 390px:** no horizontal overflow (`scrollWidth` 375 at 390 with a scrollbar), and every section stacks correctly.
- **Reduced motion:** static era surfaces, all content visible, and "Then / Now" cards side by side.
- **Contrast:** automated scan of every visible landing text node, **0 failures** against AA.
- **Headings:** one `h1` and a logical h2/h3 order. Keyboard focus shows a 2px Primary ring.
- **Portals:** the member dashboard rendered normally after sign-in, and the CSS diff shows no shared rule changes.
- **Not measured:** frame rate. The automation tab was reported `hidden`, so Chrome paused `requestAnimationFrame`. The animations were stepped manually to verify their states, but smoothness still needs a visible-window performance trace.

### Open items
- Timeline entries 2–4 are **placeholders pending adviser confirmation** (`components/landing/timeline.data.ts`).
- Photo placeholders are in `frontend/public/assets/placeholders/` (see `ASSETS.md`).
- Shared-scope issues: resolved (see above).

---

## 9. Extension to the public pages (2026-09-28)

At the owner's request, the Record style now runs through **About, Advocacies, Officers, Events, News and Join**. The site reads as one continuous document instead of separate tabs.

**Shared shell** (`frontend/src/components/landing/`):
- `PublicPage`: provides the `.lp` scope, the parchment-to-Mist era scrub between each page's `data-lp-era-start` and `data-lp-era-end`, a scroll-to-top on arrival (react-router previously kept the old scroll position), and the chapter links.
- `PageMasthead`: the same "The USWAG Record" nameplate as the front page, carrying the page's section numeral from `chapters.ts` (I About … VI Join). It sits on grained parchment, tucked under the fixed Header.
- `ChapterNav`: "Continue the record" previous/next cards, in Header nav order, at the foot of every page including the front page.
- `SectionHeading`, `PostCard` (shared by Home and News), and a reusable `LandingCTA` panel with per-page copy.

**Per-page time journey:**

| Page | Past (parchment) | Present (Mist) |
|---|---|---|
| About | Preamble, Constitution Arts. I–III | Timeline, legacy, adviser |
| Advocacies | Masthead and Art. II §2 intro | The three causes |
| Officers | **Founding officers, 2010** (placeholder roster) | Today's live roster with Art. VI duties |
| Events / News | Masthead | Live calendar / feed |
| Join | Art. III eligibility, dues | Steps, membership card morph, FAQ |

**Content corrections** (the source is `docs/01 - USWAG Constitution and Bylaws.pdf`):
- About's Preamble and Articles I–II previously did **not** match the Constitution. They now quote it verbatim.
- Officer duties now quote Art. VI §2 verbatim. Some earlier duties, such as "co-signs checks", weren't in it.
- Join's eligibility quotes Art. III. The unsourced "attend two general assemblies per semester" requirement was removed.

**Placeholders pending the adviser:**
- `timeline.data.ts`: three milestones.
- `firstOfficers.data.ts`: the founding officers' names. Titles follow the current Art. VI.

**Unverified content kept as-is** (pre-existing; confirm or remove):
- Advocacy stats: "4+ forums/semester", "200+ students reached", "500+ seedlings".
- The adviser's name and quote on About.
- The ₱50.00 fee.

**Not restyled:** Bylaws, Contact, Apply, Login, Forgot and Reset pages. They still use the old dark-hero style.

**Verification:**
- All six pages were checked in Chrome at 1280–1536px.
- At 390px there is no horizontal overflow on any page.
- An automated AA contrast scan of every visible text node found 0 failures on every page, and each page has one `h1`.
- The shared `index-*.css` has no `.lp` rules, and landing styles ship in a lazy chunk loaded only by the public pages.

## 10. Sending an application: seal, door, one per student (2026-09-29)

**The ceremony** (`ApplicationDropbox.tsx`, `MailDoor.tsx`). On submit, the page switches to a stage that runs in three phases:

| Phase | What happens | When |
|---|---|---|
| `sealing` | The open envelope folds shut and the wax seal is pressed | While the request is in flight (at least 1.7s) |
| `posting` | The mail door rises into view, swings open, takes in the envelope, shuts and bolts | Only after the server returns 201 |
| `closed` | The shut door with a "Received · Pending review" plate | Final state, and the state shown on any later visit from the same device |

- A failed request goes back to the form with the error message. The envelope never goes through the door.
- The stage is `aria-hidden`. A live region announces each step, and focus moves to the result heading.
- Reduced motion skips straight to each phase's end state.

**One application per student**: the server enforces this, not the door.

- **Email:** lowercased on apply; login and forgot-password match it case-insensitively.
- **Student ID** (required): never stored in plaintext.
  - `studentIdHash` is an HMAC-SHA256 under `STUDENT_ID_HASH_KEY`. It is permanent and unique, so a second application with the same ID gets a 409 whatever email or device it comes from.
  - `studentIdCiphertext` is an AES-256-GCM copy under a separate `STUDENT_ID_ENC_KEY`. The Secretary can decrypt it one audited request at a time (`GET /members/:id/student-id`). It is set to null the moment the application is approved or rejected.
- **Name:** never blocks. Pending applications that share a name with another member account are flagged "Same name as N other. Check ID" in the Secretary's list.
- **The device's memory** (`localStorage`): only a courtesy that shows the shut door again. It is not a lock.

**Applying for a friend** (the one exception): a friend who is present but has no device.

- The helper gives their name, and the friend reads the terms and ticks the box themselves. The helper then confirms that the friend is present and asked them to submit.
- No password is sent. The account gets an unguessable random password and `awaitingPasswordSetup = true`.
- The Secretary generates a one-time, 1-hour setup link (`POST /members/:id/setup-link`). It is refused for any other account, audit-logged, and handed over in person until email delivery exists.
- `proxyName` is deleted along with the ciphertext once the application is decided. The `submittedByProxy` flag remains.
