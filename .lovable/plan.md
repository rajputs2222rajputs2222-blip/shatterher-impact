# ShatterHer — Branding, Premium Glass UI, and Admin CMS

## 1. Brand identity
- Add the uploaded ShatterHer logo as a hosted asset and use it in the header, footer, mobile bar, and as the site favicon.
- Add a hero visual: the logo mark on the landing page hero, sitting inside a glass panel with the pink glow behind it.
- Replace the empty placeholder logo files currently in the project.

## 2. Glass + glow visual pass
- Stronger "leaking glow": brighter magenta/gold blobs, higher opacity and saturation, wider blur radius, slow drifting motion, plus a soft bloom layer so the light reads as leaking behind the content.
- Convert every card surface across the site (stats, leaderboard rows, podium, dashboard, contribute steps, ledger, achievements, profile, admin) to the liquid-glass surface: translucent blur, glassmorphic hairline border, inner sheen, deep colored shadow.
- Tap feedback: every card, row, button, and tab bulges slightly on press (scale up with a quick spring), and returns on release. Dialogs, sheets, toasts and menus keep pop-in/out animation.

## 3. Real data only
- The site will never render invented content: all stats, leaderboards, ledgers and profiles come from real submissions.
- Empty states everywhere ("No contributions yet") instead of placeholder rows.
- Note: the 10 demo members you asked to keep stay in the database for now; say the word and I'll clear them in one step.

## 4. Admin CMS
New admin area at `/admin`, reachable only by users with the admin role. The sign-in screen gets a short line pointing admins to sign in with their admin account.

CMS sections:
- **Content** — edit every piece of site copy and imagery: hero headline/sub/CTA labels, home sections, about, how-it-works, contact details and socials, footer text, logo and hero image. Stored as editable content records, so pages read from the database with the current text as the default.
- **Members** — approve/reject pending signups, activate/deactivate, edit name, role title, team, and grant admin/reviewer roles.
- **Teams & point rules** — create, edit, reorder, and archive teams, task types, unit labels, and points per unit.
- **Submissions** — the existing review queue, folded into the admin shell.
- **Achievements** — create/edit badges and award criteria.
- **Analytics** — visitor tracking (page views, unique visitors, referrers, top pages, daily trend charts) plus platform stats: signups, submissions by status, points awarded, most active teams.

## 5. Security fixes (remaining 2)
Both remaining warnings are about SECURITY DEFINER helper functions being callable by anonymous and signed-in users. Fix: revoke EXECUTE from PUBLIC on all helper functions, then grant EXECUTE only to the roles that need each one — anon for the two public read helpers, authenticated for role/permission helpers, and none for internal trigger functions.

## Technical notes
- New tables: `site_content` (key/section/value JSON, public read, admin write), `page_views` (insert allowed for anyone, read admin-only), plus admin-write policies on `teams`, `task_types`, `achievements`.
- Visitor tracking: a lightweight beacon fired on route change via a server function, writing path, referrer, anonymous visitor hash, and timestamp. Aggregation through a security-definer RPC restricted to admins.
- Admin routes live under `src/routes/_authenticated/admin/*` behind a role gate that redirects non-admins; every admin server function re-checks the admin role server-side via `has_role`.
- Glass and tap styles extend the existing `liquid`, `liquid-hover`, and `tap` utilities in `src/styles.css`; no hardcoded colors, tokens only.
- Logo goes through the CDN asset pipeline; favicon is a resized PNG in `public/`.
