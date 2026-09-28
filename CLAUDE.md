# CLAUDE.md

This file gives Claude Code the context it needs to work on this repository correctly. Read this before making changes. If something here conflicts with a request in chat, flag the conflict rather than silently picking one.

## What this project is

USWAG (United Students Working for Advocacy and Growth) is a cause-driven student organization at Northwest Samar State University (NwSSU). This repo is their official website and PWA: a public site, a member portal, and an admin console, built around a signed-QR membership system.

The organization's governing document is `docs/01 - USWAG Constitution and Bylaws.pdf`. It is the source of truth for roles, permissions, and terminology — not just a reference. Officer titles, durations, and duties in code must match it exactly (see Roles & Permissions below). If a feature request contradicts the Constitution (e.g., giving an Auditor scan access, or extending membership validity past one academic year without a renewal step), say so before implementing it.

Two companion documents carry design intent and must stay in sync with what gets built:
- `docs/USWAG_Website_Plan.docx` — sitemap, tech architecture, build sequence
- `docs/plan_extracted.txt` — plain-text extraction of the same plan, easier for quick grep/reference

The `prototype/` folder holds four static, dependency-light HTML files (`member.html`, `officer-admin.html`, `super-admin.html`, `landingDesktop.html`) that are the **approved visual and interaction reference**. They are not throwaway mockups — component structure, copy, empty/locked states, and interaction patterns in `frontend/` should trace back to them. When a prototype and a verbal request disagree on interaction design, ask which one wins rather than assuming the newer instruction overrides the prototype.

## Tech stack (do not substitute without asking)

**Frontend**: React + Vite + TypeScript, Tailwind CSS, React Query (server state) + Zustand (UI state), react-router, `qrcode` for generation, `html5-qrcode` for camera scanning, Workbox for the service worker. Deploys to Vercel.

**Backend**: Node.js + Express (or Fastify — confirm before switching), TypeScript, PostgreSQL via Prisma, JWT auth (access + refresh) with bcrypt, node-cron for scheduled jobs, `web-push` for Web Push. Deploys to Railway or Render — **not** Vercel serverless functions, because the Facebook sync cron job and QR/attendance logic need a persistent process.

**Package manager**: npm, in both `frontend/` and `backend/`. Don't introduce pnpm or yarn lockfiles.

**Integrations**: Meta Graph API for Facebook Page sync, Cloudinary or Supabase Storage for images, Neon or Supabase for Postgres hosting.



## Design tokens — apply these exactly, everywhere

```css
--deep:    #142718;  /* headers, footer, nav, body text on light bg, dark-mode surface */
--primary: #2E5B41;  /* buttons, links, active states, section headings */
--sage:    #98CBB0;  /* hover states, badges, QR frame, chart accents — NEVER body text on white (fails contrast) */
--mist:    #E7EFE4;  /* page background, cards, input fields */
```

These live in `frontend/src/styles/tokens.css` and are mapped into `tailwind.config.js` theme colors (`forest`, `primary`, `sage`, `mist` — check the config for exact key names before inventing new ones). Never hardcode hex values in components; always reference the Tailwind token or CSS variable. If a new color is genuinely needed (e.g., a semantic red for "expired" or amber for "pending"), add it to `tokens.css` with a comment explaining its use, don't invent one inline.

Typography is a deliberate two-typeface system, not one global pairing:
- **Public marketing site** (`landingDesktop.html`): Lora (serif) for headings — "institutional authority" — paired with Inter for body/data.
- **Member / Officer Admin / Super Admin portals** (`member.html`, `officer-admin.html`, `super-admin.html`): Poppins (rounded-confident sans) for headings, paired with Inter for body/data.

All three faces are wired into `index.html`'s `<link>` tag and exposed as Tailwind font families in `tailwind.config.js`/`tokens.css`: `display` (Lora, public site) and `heading` (Poppins, portals), both alongside `body` (Inter). Don't default to one face site-wide — check which section (public vs. portal) a component belongs to before picking a heading class.

## Roles & permissions — this is the part to get exactly right

Four tiers, matching Article VI of the Constitution and the three prototype files:

| Role | Constitution basis | Prototype file | Scope |
|---|---|---|---|
| **Super Admin** | President (+ delegated VP) | `super-admin.html` | Everything: bylaws editing, officer account management, amendment approval, all analytics, admin access issuance each academic year |
| **Officer Admin** | Secretary, Treasurer, Auditor, Business Manager, PRO (Art. VI §2) | `officer-admin.html` | Scoped strictly by position — see below |
| **Member** | Art. III, verified org family | `member.html` | Own dashboard, own QR, own attendance, RSVP, notifications |
| **Public/Guest** | Anyone | — | Public pages only, no auth |

Officer Admin scope, exactly as encoded in the `officer-admin.html` prototype's `ROLES` object — treat that object as the canonical scope definition when writing backend RBAC middleware and frontend route guards:

- **Secretary**: members (approve/reject applications, roster), meeting minutes, announcements, scan
- **Treasurer**: dues, expenses, financial statements, scan
- **Auditor**: read-only financial records, read-only attendance records, submit audit reports — **no scan access, no write access to finance**. This is intentional, not an oversight — Article VI gives the Auditor an oversight role, not a field role.
- **Business Manager**: purchase requests, supplier coordination, scan
- **PRO**: news posts, Facebook sync management, scan (assigned events only)

When a permission boundary is hit in the UI, do not simply hide the nav item. Follow the prototype's pattern from the Auditor's Scan tab: show the destination, explain in plain language why it's out of scope for this role, and point to where the related read-only view lives. This applies to any future scope boundary, not just that one case — a permission system should be legible, not silently absent.

Backend enforcement is mandatory regardless of what the frontend hides. Every controller/route touching a scoped resource must check role + specific permission via `role.middleware.ts`, never rely on the frontend not rendering a button.

## QR membership system — security-relevant, follow this exactly

- Each member gets a server-generated **UUID** at approval — never a sequential or guessable ID.
- The QR encodes a **signed token**: UUID + HMAC-SHA256 signature using a server-side secret (see `backend/src/services/qr.service.ts` and `backend/src/utils/crypto.ts`). The QR itself is not sensitive; the signature is what prevents a cloned/edited QR from validating.
- Every scan attempt is logged — valid, invalid, and expired — via `attendance.service.ts` and `audit.service.ts`, regardless of outcome. This is how duplicate/cloned-QR use gets caught (same serial scanned at two locations minutes apart).
- Verification flow: officer's phone camera (via `html5-qrcode`) → `POST /api/v1/scan` → backend verifies signature → checks membership status (active per annual renewal, Art. III §3) → returns valid/invalid/expired → frontend renders the corresponding `ScanResultCard` state.
- Do not implement client-side-only QR validation for anything that gates attendance or eligibility. The client can render optimistic UI, but the server call is the source of truth.
- If asked to "make QR scanning work offline," push back — signature verification against current membership status requires a live backend check; a fully offline mode would defeat the anti-clone design. A queued-scan-then-sync pattern is fine to discuss, but flag the standing-status staleness tradeoff.

## Facebook sync

Server-side only, via a `node-cron` job (`backend/src/jobs/facebookSync.job.ts`) polling the Graph API `/{page-id}/posts` endpoint roughly every 30–60 minutes, deduplicated by Facebook post ID, upserted into a `posts` table. Never call the Graph API directly from the frontend — the Page Access Token must not reach the client. `postService.ts` on the frontend only ever talks to our own backend's `/api/v1/posts`.

## File & naming conventions

- React components: PascalCase filenames matching the exported component (`EventCard.tsx`, not `event-card.tsx`).
- Hooks: `useX.ts` camelCase, one hook per file, matching the folder structure already laid out in `frontend/src/hooks/`.
- Services (frontend HTTP clients): `xService.ts`. Services (backend business logic): `x.service.ts`. Don't blur these — frontend `services/` calls the API; backend `services/` contains the actual logic controllers delegate to.
- Types: `x.types.ts`, colocated in `types/`, not inlined redundantly across files — import the shared interface.
- Routes (backend): `x.routes.ts`, mounted under `/api/v1/x` via `routes/index.ts`. Keep route files thin — validation goes in `validation.middleware.ts`, logic goes in `controllers/` and `services/`.
- Controllers stay thin too: parse request, call a service, shape the response via `utils/response.ts`. Business logic belongs in `services/`, not `controllers/`.
- Match the exact directory layout in `filestructure.txt` (section 2, target architecture) when creating new files. If a new file doesn't obviously fit an existing folder, ask rather than inventing a new top-level directory.

## What NOT to do

- Don't add authentication shortcuts, hardcoded test tokens, or role bypasses "for now" — this is a real system handling real membership data and financial records for a student organization, and shortcuts have a way of surviving into production.
- Don't invent new officer roles, rename existing ones, or change term lengths without the Constitution being amended first (Article IX). If a request implies a bylaws change, say so explicitly.
- Don't put Meta Graph API tokens, database credentials, or JWT secrets in anything other than `.env` (gitignored) — `.env.example` shows the shape, never the values.
- Don't build Facebook posting/writing features — sync is read-only, pulling posts the officers already made on the actual Facebook Page. This isn't a Facebook management tool.
- Don't silently change the color palette, font pairing, or the mobile-first/desktop-first split (Member and Officer Admin are mobile-first; Super Admin is desktop-first) — these were deliberate decisions made across the planning doc and all three prototypes.

## Working style for this repo

- When implementing a page or component, check the matching prototype HTML file first for the intended layout, copy, and states (loading, empty, error, locked) before designing from scratch.
- Prefer extending the existing plan (`docs/plan_extracted.txt`) over introducing new architecture. If the existing plan is genuinely wrong or outdated, say why before deviating.
- This is a real deployable project for a real student org with a real adviser and real stakeholders, not a demo — hold it to that bar: proper error handling, accessible components (the site skews younger but is also read by an adviser and university administration), and no placeholder content left in production paths.
