# Landing page asset manifest

The `.svg` files in this folder are **labelled placeholders**. None of them are rendered on the live site. The landing page ships with code-generated artwork (the newspaper clipping, founding flyer, engraved crest, and membership card in `src/components/landing/artifacts/`), so nothing breaks while real photos are missing.

When a real asset is ready:

1. Export it as **WebP** (quality 78–82), plus an **AVIF** version, at the dimensions below. Name it after the placeholder, e.g. `archive-founding-group.webp` / `.avif`.
2. Put it in this folder and delete the matching `.svg` placeholder.
3. Ask a developer to wire it into the section listed under "Used in". Use `loading="lazy"`, `decoding="async"`, explicit `width`/`height`, and honest `alt` text.

**People in photos must consent to appearing on the public site.** Get written consent for anyone clearly identifiable, especially minors.

**Archive photos are shown through the page's sepia filter automatically.** Supply them in their original colors and don't pre-tint them.

| File | Dimensions | Subject | Used in | Style notes |
|---|---|---|---|---|
| `archive-founding-group` | 1600×1067 (3:2) | Founding members, c. 2010 | S2 Origin, as a print beside the flyer | A **real archive scan is strongly preferred** over anything generated. Scan at 600 dpi and keep the grain, creases and borders. |
| `archive-early-event` | 1200×900 (4:3) | An early USWAG assembly, outreach, or campaign | S3 Timeline, attached to its confirmed milestone | Real photo. Candid rather than posed. Crop tight on people. |
| `archive-flyer-scan` | 900×1273 (≈A-series portrait) | An original printed USWAG flyer or poster, if one survives | S2 Origin, replacing the code-drawn flyer | Flat-bed scan at 300–600 dpi, lit evenly, no perspective skew. |
| `present-campus-today` | 1600×1000 (16:10) | Today's members on the NwSSU campus | S5 Impact, above the stewards row | Natural daylight, full color, genuine activity (a meeting, cleanup, forum). Leave clear space on the left third. |
| `present-member-scan` | 1200×900 (4:3) | An officer scanning a member's digital QR card at an event | S4 Rebirth, beside the card morph | Close-up of phone and card, shallow depth of field. The QR must be **blurred or out of frame** so a real signed code is never published. |

## Generation prompts (only if no real photo exists)

Use these for **illustrative stand-ins**, never for "archive" material. A generated image must never be presented as a real historical photo of USWAG. If you generate one, label it as an illustration in its caption.

- **present-campus-today:** *"Candid documentary photo of Filipino university students in casual clothes having an outdoor discussion under trees on a provincial state-university campus in Samar, Philippines, warm late-afternoon natural light, muted greens, 16:10, no text, no logos, realistic, 35mm."*
- **present-member-scan:** *"Close-up photo of a student volunteer holding a smartphone to scan a digital ID card on another student's phone at a campus event check-in table, shallow depth of field, QR code blurred and unreadable, soft indoor light, green-and-cream color palette, 4:3, no text, no logos."*
- **archive-early-event (illustration only):** *"Engraved halftone illustration in the style of a 2010s community newsletter: students gathered in a campus hall listening to a speaker, single-ink dark green (#142718) on warm parchment (#EFEADA), coarse dot screen, no text."*
