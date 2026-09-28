# USWAG Official Website & PWA

**United Students Working for Advocacy and Growth**
Northwest Samar State University — Main Campus, Calbayog City

The official website and installable Progressive Web App for USWAG, a cause-driven student organization built around three advocacies: **Youth Voice & Participation**, **Mental Health & Wellness**, and **Environmental Leadership**.

This platform serves as the organization's digital headquarters — public-facing pages for anyone, a member portal with a signed digital membership QR, and an admin console for officers to manage events, members, content, and governance records, all grounded in USWAG's Constitution and By-Laws.

---

## What's in this repo

```
USWAG-OFFICIAL_WEBSITE/
├── docs/           Constitution, project plan, and technical reference docs
├── prototype/      Standalone HTML/CSS/JS UI prototypes (no build step — just open in a browser)
├── frontend/       React + Vite + TypeScript PWA (not yet scaffolded)
└── backend/        Node.js + Express + PostgreSQL API (not yet scaffolded)
```

See `filestructure.txt` for the full target directory tree, and `claude.md` if you're using Claude Code on this repo — it documents the conventions, roles, and constraints the codebase follows.

## Try the prototypes

No install required — these are self-contained HTML files. Just open them in a browser:

| File | What it shows |
|---|---|
| `prototype/member.html` | Mobile-first member experience: dashboard, digital QR membership card, attendance history, event RSVP, notifications |
| `prototype/officer-admin.html` | Mobile-first officer console with a role switcher (Secretary, Treasurer, Auditor, Business Manager, PRO) demonstrating scoped permissions per Article VI |
| `prototype/super-admin.html` | Desktop-first admin console for the President/VP: org-wide dashboard, member management, event creation, live QR scan console, officer roster, bylaws & amendments |

These prototypes are the approved reference for layout, copy, and interaction design — not throwaway mockups. Development should match them unless a change is explicitly agreed on.

## The organization, briefly

USWAG is grounded in a Constitution ratified at NwSSU that defines its purpose, membership rules, officer structure, and governance process. A few things worth knowing before touching the product:

- **Membership** is open to all bona fide NwSSU students, valid for one academic year, renewable annually.
- **Officers** (President, Vice President, Secretary, Treasurer, Auditor, Business Manager, and one PRO per college/department) serve one-year terms with duties explicitly defined in Article VI.
- **Two governance entities** map directly onto the platform's user roles: officers (Admin) manage content, events, membership, and bylaws; general members (Member) are the verified "org family" who carry the organization's history and legacy forward.

The full Constitution and By-Laws are in `docs/01 - USWAG Constitution and Bylaws.pdf`.

## Design system

A single palette, applied consistently everywhere — public site, member app, and admin console:

| Token | Hex | Used for |
|---|---|---|
| Deep Forest | `#142718` | Headers, footer, nav, primary text, dark surfaces |
| Primary Green | `#2E5B41` | Buttons, links, active states, section headings |
| Sage Accent | `#98CBB0` | Hover states, badges, QR frame, accents (never as body text — contrast is too low) |
| Mist Background | `#E7EFE4` | Page background, cards, input fields |

Typography pairs **Poppins** (headings — confident, rounded, youth-forward) with **Inter** (body and data-dense content like bylaws and reports).

## User roles

| Role | Who | Access |
|---|---|---|
| **Super Admin** | President, delegated VP | Full system control: bylaws, officer accounts, amendments, analytics |
| **Officer Admin** | Secretary, Treasurer, Auditor, Business Manager, PRO | Scoped to their Article VI duties — see the officer-admin prototype for exact boundaries per role |
| **Member** | Verified org family | Personal dashboard, digital QR ID, attendance history, event RSVP, notifications |
| **Public / Guest** | Anyone | Public pages: About, Advocacies, Officers, Events, News, Join Us, Bylaws (read-only) |

## The QR membership system

Every approved member gets a unique, cryptographically signed QR code — not just a random ID, but a UUID paired with an HMAC signature that a screenshot or photocopy can't forge. Officers scan it from their own phones (no special hardware needed) to log attendance at events. Every scan — valid, invalid, or expired — is logged, which is what makes a cloned or reused QR detectable rather than just theoretically insecure.

This QR doubles as the member's digital ID card and is the basis for selecting participants in limited-slot activities based on attendance standing.

## Tech stack

**Frontend** — React, Vite, TypeScript, Tailwind CSS, React Query + Zustand, React Router, `html5-qrcode`, Workbox (PWA service worker). Deployed on Vercel.

**Backend** — Node.js, Express, TypeScript, PostgreSQL (via Prisma), JWT auth, `node-cron` for the Facebook sync job, Web Push API for notifications. Deployed on Railway or Render.

**Integrations** — Meta Graph API (read-only Facebook Page sync), Cloudinary or Supabase Storage.

Full architecture, sitemap, and build sequence are documented in `docs/USWAG_Website_Plan.docx`.

## Status

Currently in the prototyping phase — UI/UX prototypes are complete and ready for adviser and stakeholder review. `frontend/` and `backend/` scaffolding is next.

## Questions or feedback

This project is developed for and with USWAG at Northwest Samar State University. For questions about the organization itself, refer to the Constitution and By-Laws in `docs/`, or reach out to the current USWAG officers or organization adviser.
