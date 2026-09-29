# Member portal redesign (2026-09-29)

The public Record's present-day layer, rebuilt as an app for members. There is no classical layer: no parchment, sepia or serif.

## Decisions

- **Headings:** Poppins, following CLAUDE.md's portal typography. Body text is Inter.
- **Scope:** members only. Officers and the Super Admin keep `DashboardLayout` and their existing pages, including `/dashboard/profile`.
- **Pending, expired and rejected members:** no digital card and no event sign-ups. Both destinations stay visible, locked and explained.
- **Mobile navigation:** five tabs, with the card raised in the centre. A "More" tab and sheet appear only when a role has more than five destinations.

## Enforcement (server)

| Endpoint | Rule |
|---|---|
| `GET /members/me/qr` | 403 unless ACTIVE; the QR is never generated otherwise. `details.standing` holds the status. |
| `POST /events/:id/rsvp` | 403 unless ACTIVE. 404 for an unknown event, 409 for a completed or cancelled one. Out-of-campus sign-ups are stored as `applied`. |
| `GET /members/me` | Adds `standingNote`, the plain-language reason, or null when active. |
| `GET /events/me/rsvps` | The member's own sign-ups, so "Going ✓" survives a reload and "Events joined" is real. |

All reason text is written once, in `member.service.ts` `standingBlock()`.

## Structure

- **Routing:** `routes/PortalLayout.tsx` picks the shell by role. For members it lazy-loads `components/member/MemberLayout` (which imports `member.css`) and `MemberProfilePage`; everyone else gets `DashboardLayout` and `ProfilePage`.
- **Styles:**
  - `styles/premium.css`: the shared present-day primitives (plate card, vault, seal, cameo, date plate, chips, lift). Each rule is written once for `.lp-*` and `.mp-*`.
  - `landing.css` imports it. The landing CSS chunk was verified identical rule for rule (212 selectors, 0 differences).
  - `styles/member.css`: everything else, scoped to `.mp` or `.mp-*`, and shipped only in the member chunk. The shared `index.css` has no `.mp` rules.
- **Navigation:** `config/navigation.tsx` defines the member items. `centre` marks the raised tab; `activeOnly` marks destinations that show a lock when the member isn't active.
- **Pages:**
  - Home: standing vault, the member's own numbers, coming up, advocacies, news.
  - Card: the card only.
  - Attendance: its own tab, a ledger of scans.
  - Events: filter chips, RSVP, and an apply dialog for out-of-campus events.
  - Profile.

## Status inks

The semantic tokens `--color-success`, `--color-warn` and `--color-danger` fail AA as small text on their own `-bg` tints. `member.css` defines darker inks for text, used only inside `.mp`:

| Token | Contrast on its tint |
|---|---|
| `--mp-success-ink` | 5.9:1 |
| `--mp-warn-ink` | 6.3:1 |
| `--mp-danger-ink` | 6.7:1 |

## Verification

- **Chrome, desktop (1280–1536px) and 390px:** the pages were checked as active, pending, expired and rejected members.
  - Pending, expired and rejected: no QR request is made and there are no RSVP buttons.
  - The automated AA contrast scan found 0 failures on every page and state checked.
  - No horizontal overflow at 390px.
- **Officer check:** a Secretary still gets `DashboardLayout` and the permissions list on `/dashboard/profile`.
- **Server rules:** tested end to end for pending, expired and active members (15 checks).
