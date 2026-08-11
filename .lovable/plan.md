# ShatterHerLeaders — Phase 1

A purpose-built contribution + recognition platform for ShatterHer. Phase 1 covers the full public site and the complete member experience. Admin tooling comes in Phase 2 (a minimal review path is included so contributions can actually be approved).

## Visual identity

Ink & Magenta: deep ink `#0E0B14` base, warm bone `#F2EFE9`, magenta `#D6246E` accent, gold `#F2B705` highlight. Editorial serif display type paired with a clean grotesque for UI. Layered gradients, grain texture, glass surfaces, abstract shapes. Mobile-first layouts throughout — not compressed desktop.

## Public pages

- **Home** — hero "Every contribution counts.", dual CTAs, live stat strip (members, contributions, points, teams), leaderboard preview, the Create → Contribute → Lead loop.
- **Leaderboard** — the centerpiece. Podium treatment for top 3 (crown for #1, distinct #2/#3 styling), then ranked rows. Filters: Overall / This Week / This Month / Team / Role, plus member search. Paginated.
- **Member profile** (`/members/$id`) — recognition page: avatar, role, points, rank, contribution breakdown by category, recent contribution timeline.
- **Point System** — all earning rules by category, driven from the database (never hardcoded). Partnerships and Content Review get special visual treatment.
- **How It Works** — the four steps.
- **About** — warm, empowering copy about ShatterHer.
- **Contact** — email, Instagram CTA linking to @shatterher_official.

## Member area (sign-in required)

- **Dashboard** — "Welcome back, [Name]", stat cards (points, rank, contributions, this month), then a prominent "What did you contribute today?" card with the primary `+ Share Your Contribution` button, plus a progress bar toward the next rank.
- **Share Your Contribution** — 3-step flow: category cards → contribution type (options filtered by category) → details ("What did you create or accomplish?", "Tell us about your contribution", "How much did you contribute?"). Drag-and-drop multi-file upload (images, video, audio, PDF, docs, sheets, slides, ZIP, text) with per-file progress, size, remove and success states — plus a "Prefer to write it here?" text area so text contributions need no file.
- **My Contributions** — cards on mobile / table on desktop: date, contribution, category, quantity, points, status badge, files.
- **Points History** — ledger with running total.
- **Achievements** — auto-earned badges (First Contribution, 500/1,000 Point Club, 10 Contributions, Top 3 Leader, Consistency, Community Builder).
- **Profile** — edit name, avatar, team, role.

## Accounts and approval

Open sign-up; new members start **Pending** until an admin activates them. Pending members can browse but not contribute. Contributions never award points automatically — they sit **Pending** until reviewed, then Approved / Rejected / Revision Required. Approval writes a points ledger entry, which is what the leaderboard reads.

Points = approved quantity × points_per_unit, with an admin override field. Every point change is audited in the ledger.

## Technical notes

- Lovable Cloud (Postgres + auth + storage) with tables: `profiles`, `teams`, `task_types`, `submissions`, `submission_files`, `points_ledger`, `achievements`, `user_achievements`, and a separate `user_roles` table with a `has_role()` security-definer function (roles never on the profile table).
- Row-level security everywhere: members read/write only their own submissions; leaderboard reads come from a public aggregate view exposing only safe columns; file storage is private with signed URLs and server-side validation of type and size.
- Point rules live entirely in `task_types` and are seeded via migration with every value from the spec (Magazine 50/page, Short Form 80, Long Form 90, Audience/Trend Research 85, Content Creator 95, Collab Reel 80, Content Review 80, Poem 85, Non-Poetic 80/page, Script 70/page, Partnership 90, Collaboration 70, Podcast Artist 95, Episode Planner 85, Research 90, Audio/Video Editing 60).
- Public pages are server-rendered with their own SEO metadata; member pages sit behind the auth gate. Reads go through server functions; leaderboard and history are paginated.
- Shared design-system components (button, card, badge, avatar, stat card, leaderboard row, contribution card, uploader, progress, tabs, toast, dialog, data table) — no duplicates.
- Seeded demo members and contributions so the leaderboard is alive on first load.
- Accessibility: keyboard nav, labels, focus states, contrast, large touch targets. Subtle motion only — count-ups, rank transitions, success animation.

## Phase 2 (not in this build)

Admin dashboard, contribution review queue, member management, point rule editor, analytics charts. A temporary minimal approve/reject screen for admins ships in Phase 1 so the points engine is testable end to end.
