# Reference audit: therecord.institute

Audited 2026-09-28 with Claude in Chrome at a 1536×695 desktop viewport. The site is a React + Tailwind v4 SPA built with Vite. It ships one CSS bundle (`index-BBgFgP_L.css`), and all the values below come from computed styles and the live `CSSStyleSheet` rules. It defaults to a **dark theme** (`html.dark`) and also has a light "parchment" theme. The light-theme tokens are listed so we can compare them.

> We use this site only for principles: hierarchy, pacing and motion. We do not copy its layout, copy, imagery or its gold/red palette. See `landing-architecture.md` for how each principle maps onto USWAG's green palette.

---

## 1. Color palette

### Dark theme (default, what visitors see)
| Role | Value | Notes |
|---|---|---|
| Page background | `#121212` (body), sections `#0A0A0A → #0F0F0F → #0A0808` vertical gradients | Near-black with a slight warm tint. Sections alternate between very close blacks. |
| Header surface | `rgba(15,15,15,.95)` + `backdrop-blur-md` | Bottom border `rgba(212,197,169,.06)` |
| Footer | `#0C0C0B` | |
| Body text | `#D4C5A9` (warm parchment on black) | Subtitles use the same color at 70% alpha |
| Nav text | `rgba(212,197,169,.72)` | |
| Accent gold | `#C9A84C` for section H2s, `#D4AF37` for hover gold, `#B87333` copper for the scrollbar and focus ring | |
| Accent red | `#8B1A1A` / `#B91C1C` for CTA hover sweep fills, diamond ornaments and the typewriter cursor | |
| Borders | `rgba(212,197,169,.06–.12)` hairlines | Borders are always hairlines at very low alpha. |

### Light theme tokens (`--theme-*` on `:root`)
`--theme-bg #F5F0E1` · `--theme-bg-card #F8F5EF` · `--theme-bg-deep #EDE8DD` · `--theme-text #2C2016` · `--theme-text-secondary #4A3A2E` · `--theme-text-muted #6A5A4A` · `--theme-text-faint #7A6A5A` · `--theme-border #DDD8CC` · `--theme-accent-gold #B87333` · `--theme-accent-red #8B1A1A` · `--prose-heading #8C6239` · card shadow `0 2px 12px #2C20160F`, hover `0 8px 30px #2C20161A`.

**Takeaway:** the page uses one warm hue family for everything, and hierarchy comes from alpha (100 / 72 / 70 / 12 / 6%) rather than new hues. Only two accents appear (gold and oxblood), and they are used sparingly.

## 2. Typography

| Face | Use | Observed values |
|---|---|---|
| **Cinzel** (engraved Roman capitals) 400–700 | H1, H2, H3, card titles | H1 88px / lh 1.1 / **ls 22px (0.25em)** / 700, with a gold glow text-shadow. Section H2 44px / lh 1.2 / ls 0.08em. H3 36px / ls 0.15em. Card H4 10–14px uppercase / ls 0.06–0.1em. |
| **Playfair Display** italic | Italic subheads and pull-quotes ("Museum Heritage Grade") | Used as an ornamental voice only |
| **Courier Prime** 400/700 | Body, nav, buttons, metadata | Body 16px / lh 1.6 (25.6px). Nav 11px uppercase / ls 0.2em. Buttons 16px with wide tracking. |

- **Size scale (desktop):** 88 → 44 → 36 → 20 → 16 → 14 → 12 → 11 → 10px. It is a steep display step followed by a very flat run of small sizes.
- **Mobile scale:** H1 comes from `text-3xl sm:text-5xl lg:text-7xl xl:text-[5.5rem]`, so it is 30px on phones.
- **How hierarchy is built:** size contrast at the top of the scale. Below that, **letter-spacing and case do the work instead of weight**, and wide-tracked uppercase monospace reads as "archival label". Weight is almost always 400 or 700.
- **Letter-spacing as motion:** nav links animate letter-spacing on hover (`0.2em → 0.28em`) with a "breathe" effect.

## 3. Spacing, grid and rhythm

- **Containers:** `max-w-7xl` (1280) for general content, `max-w-6xl` (1152) for galleries, `max-w-4xl` (896) for text blocks, and `max-w-2xl` (672) for intro copy.
- **Section padding:** `py-24 sm:py-32` (96/128px) is the standard. Hero-adjacent feature sections use `py-28 sm:py-40` (112/160px), and dense listing sections use `py-16 sm:py-20`.
- **Section rhythm:** each section opens with an eyebrow in small red caps, then a Cinzel H2, then an italic or mono subline, then a **diamond ornament divider** (`◇◆◇` with hairlines). It is the same "catalogue entry" pattern every time.
- **Hero:** `min-h-screen` with centered content. The large wordmark sits in a stacked lockup with a hairline, diamond and hairline underneath.
- **Radius:** `--radius: .25rem`, and most elements are square (0px). Nothing on the page is pill-shaped.
- **Performance trick:** below-the-fold sections are wrapped in `.cv-auto` (`content-visibility: auto`) with a 600px intrinsic-size placeholder.

## 4. Scroll animations

| Effect | Trigger | What animates | Values |
|---|---|---|---|
| Hero entrance | Page load | H1 `fade-in`, H2 `fade-in-up` with a `delay-300` class | fadeIn 0.6s ease-out; fadeInUp 0.8s ease-out, `translateY(24px)→0` |
| Hero parallax | Scroll position (JS) | The background `<img>` and `.hero-background-depth` glow layer scale up and translate down | The image reaches roughly `scale(1.09) translateY(159px)` by about 500px of scroll, and the glow layer `scale(1.04) translateY(55px)` with opacity 0.78→0.70 |
| Hero pointer light | Mouse move (JS) | A radial gold spotlight follows the pointer using `--hero-pointer-x/y` | `radial-gradient(ellipse 42% 34% …)`, opacity transition 0.22s |
| Card stagger | IntersectionObserver adds `.in-view` | `.stagger-card` | `staggerFadeInUp` 0.7s `cubic-bezier(0.25,1,0.5,1)`, `translateY(40px)→0`, **60ms stagger** per card (inline `animation-delay: 0,60,120…ms`) |
| Divider float | `.in-view` | `.divider-float` ornaments | `translateY(12px)→0`, opacity 0→1, 0.8s `cubic-bezier(0.25,1,0.5,1)` |
| Count-up | In view | Archive count ("639") | `artifactFadeIn` 1.5s ease-out, `translateY(8px)`, then an infinite `artifactGlowPulse` for 3s |
| Scroll progress | Scroll | A fixed 2px gold gradient bar across the top (`.scroll-progress-bar`) | Updated from JS |

The order is always eyebrow, then heading, then divider, then cards. Every reveal is a single upward move (8–40px) plus a fade. Nothing slides in from the side, and nothing rotates or scales on entrance.

## 5. Hover and focus

| Element | Effect | Timing |
|---|---|---|
| Nav link | Color goes to gold and **letter-spacing widens** to 0.28em. A 1px gold underline `scaleX(0→1)` from the left | 0.5s `cubic-bezier(0.25,1,0.5,1)`; underline 0.3s |
| Primary CTA (`.cta-sweep`) | A solid fill **wipes left→right** (`::before scaleX(0→1)`, origin left). The border turns red, text goes white, and an outer glow appears | Wipe 0.6s `cubic-bezier(0.25,1,0.5,1)`; border/shadow 0.5s |
| CTA depth | On press, `translateY(1px) scale(.985)`. A `::before` 1px gold outline at `inset:-4px` fades and scales in | 0.18s `cubic-bezier(0.22,1,0.36,1)` |
| Shimmer | A 50%-width skewed white gradient sweeps across once on hover | 1–1.2s |
| Artifact images | `filter: sepia(.8) grayscale(.2) brightness(.92)` by default, going to **full color with scale(1.02)** on hover | filter 0.8s, transform 0.7s `cubic-bezier(0.25,1,0.5,1)` |
| Card text | Title lifts `translateY(-4px)` and turns gold | 0.5s |
| Dossier card | The SVG border rect **draws itself** (`stroke-dashoffset 2000→0`), then a bloom fades in after a **0.55s delay**, then the image brightens | draw 0.6s `cubic-bezier(0.4,0,0.2,1)` |
| Gallery card press | `translateY(-1px) scale(.992)` | 0.18s `cubic-bezier(0.23,1,0.32,1)` |
| Focus | `--ring` is copper `oklch(53.1% .0786 64)`. On a custom link, `:focus-visible` mirrors the hover state with an underline and 5px offset | Only a few components wire hover and focus-visible together |

**The best idea to borrow:** images are **sepia at rest and in color when engaged**. The "past becomes present" metaphor is already built into the interaction layer.

## 6. Page and section transitions

- There are no route-level page transitions (it is a plain SPA route swap).
- Between sections there are no hard edges. Sections are separated by gradient backgrounds and the ornament divider, so the scroll feels continuous.
- The hero hands off to the next section through a `linear-gradient(rgba(15,15,15,.8) → .6 → #0F0F0F)` overlay plus a radial vignette, so the photo dissolves into the page.

## 7. Easing and duration vocabulary

| Token (our name) | Value | Used for |
|---|---|---|
| ease-out-quart-ish | `cubic-bezier(0.25, 1, 0.5, 1)` | **The house curve.** Reveals, nav, CTA wipe, image hover |
| ease-out-expo-ish | `cubic-bezier(0.22, 1, 0.36, 1)` / `(0.23, 1, 0.32, 1)` | Press and depth micro-interactions |
| material standard | `cubic-bezier(0.4, 0, 0.2, 1)` | SVG border draw |
| ease-out | `ease-out` | Simple fades |

Durations fall into three bands: **micro 0.15–0.25s** (press, focus, pointer light), **UI 0.3–0.6s** (hover, underline, wipe) and **narrative 0.7–1.5s** (reveals, count-up, image desaturation). Infinite ambient pulses run from 2 to 4s.

## 8. Visual hierarchy

- **Hero:** (1) the huge tracked Cinzel wordmark with a soft glow; (2) the sepia archival photo behind it, dimmed to about 20% by overlays; (3) the italic tagline "Preserving the Soul of the Analog Era" under a hairline and diamond; (4) the ghost CTA with its red sweep.
- **Feature section:** a big framed image on the left (gold "museum frame" gradient border), the gold H2 on the right, and a mono paragraph. The eye goes image, then heading, then copy.
- **Rarity table:** a ledger/catalogue layout with an accession number column in tiny mono, a class glyph (Ω, SSS) and an italic grade name. The typography does all the ranking.
- **Listings:** image first, then a small uppercase title, then mono metadata.

## 9. Texture and atmosphere

- **Overlays:** stacked `radial-gradient` warm glows with `mix-blend-mode: screen`, a dark linear overlay and a radial vignette. There is **no raster grain file**, so the texture comes from the photos themselves.
- **Image treatment:** CSS `sepia()` and `grayscale()` filters make modern color scans look aged, and the filter is removed on hover.
- **Frames:** `.museum-artifact-frame` uses a 6-stop metallic gold linear gradient as the "frame", an inset 1px highlight and a dark mat, like a physical picture frame.
- **Text glow:** a slow infinite `text-shadow` pulse on the wordmark.
- **Ornaments:** diamond and hairline dividers, corner brackets, and uppercase mono labels that read like accession numbers.
- **Shadows:** warm-tinted `#2C2016` at 6–10% alpha. Shadows are never neutral grey.

## 10. Performance and accessibility notes

**Good**
- `content-visibility: auto` on below-fold sections.
- 30 of 33 images use `loading="lazy"`, 26 of 33 are WebP, and every image has `alt`.
- `prefers-reduced-motion` blocks turn off stagger, shimmer, shake, glow pulse, the hero parallax and the pointer light, and force final states visible.
- There is one `<h1>` and `lang="en"`.

**Problems (things to avoid)**
- **No skip link.** Keyboard users have to tab through roughly 25 nav items first.
- **Many icon-only nav buttons have no text** (dropdown chevrons read as `""`).
- **Contrast:** nav text at 72% alpha, `rgba(212,197,169,.72)` on `#121212`, passes. Some tiny mono metadata at 10–11px with low alpha is borderline, and 10px uppercase text is hard to read however much contrast it has.
- **Body set in a monospace (Courier)** slows reading on long paragraphs. It is fine for labels but not for paragraphs.
- **Lazy images show as empty dark boxes** while scrolling (visible in the screenshots). There are no blur-up placeholders.
- **Three webfont families with 4 weights each, plus italics**, is a heavy font payload.
- **Infinite animations** (rarity pulses, glow, `subtleShake` every 5s) keep the compositor busy and add visual noise. `shake-on-idle` in particular is distracting.
- **Third-party analytics** (GTM plus a second analytics script) load on the landing page.
- A fixed floating "research tray" widget overlaps content at the bottom right on small viewports.

## 11. Principles to take forward
1. **One hue family, and hierarchy through alpha.** Keep accents rare.
2. **Tracked uppercase labels** as the archival voice (accession numbers, dates, datelines).
3. **Sepia at rest, color when engaged.** This is the core "past to present" interaction.
4. **A single house easing curve** (`0.25,1,0.5,1`) and three duration bands.
5. **Short upward reveals** (12–40px) with a 60ms stagger, and no sideways motion.
6. **Section openers repeated like catalogue entries** (eyebrow, heading, ornament).
7. **Gradients between sections** so the page feels like one continuous scroll.

Things we will not copy: black and gold, Cinzel/Courier, the pointer spotlight, idle shakes, infinite glows, and monospace body text.
