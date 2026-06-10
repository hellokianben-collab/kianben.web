# KiAnben Redesign — "Manifest"

Drop-in replacement for 3 files in repo root: `index.html`, `styles.css`, `main.js`.
Nothing else changes. Server, admin panel, API — untouched.

## Deploy
1. Replace the 3 files in repo root.
2. `git add index.html styles.css main.js && git commit -m "redesign: manifest" && git push`
3. Railway auto-deploys.

## What changed
- New design language: shipping-document theme. Light "manifest" pages + dark harbor-ink bands.
- Fonts: Saira Condensed (display) + IBM Plex Sans (body) + IBM Plex Mono (route codes, labels) + Zilla Slab (wordmark only).
- Logo rebuilt as text wordmark — crisp at any size, no more PNG-on-dark mismatch.
- Signature elements: rotating customs-seal SVG, waybill card in hero, mono route codes (CN→BD), REF-numbered sections, cost-comparison ledger table.
- Removed: Font Awesome (inline SVG sprite instead), Unsplash hotlinked photos, fake "0+" counters, emoji flags. Honest facts instead: 1% / 15+ / 24h.
- Real WhatsApp number (8801683000984) replaces 8801XXXXXXXXX placeholders.
- Accessibility: skip link, aria-modal dialogs, role=alert errors, focus-visible, autocomplete attrs, prefers-reduced-motion, 44px+ tap targets.

## What did NOT change (guaranteed)
- All API endpoints and payloads: /api/auth/login, /api/auth/verify, /api/auth/profile, /api/members/apply, /api/announcements/request, /api/announcements/quote, /api/announcements/published.
- All form field names and IDs (joinForm, signinForm, announcementForm, profileForm, quoteForm + every input name).
- Session: localStorage kb_token / kb_user / kb_expiry, 7-day expiry, silent verify.
- admin.html / admin.css / admin-panel.js — untouched.

## ⚠ SECURITY — DO THIS NOW
Your public repo leaks live secrets. Anyone can read them.

1. `.env` is committed in git history. Leaked: Gmail app password, JWT_SECRET, ADMIN_JWT_SECRET, ADMIN_PASSWORD.
   - Rotate ALL of them today: new Gmail app password (myaccount.google.com → Security → App passwords), new random JWT secrets, new admin password. Update values in Railway env vars only.
2. `kianben.json` (your live member database, incl. bcrypt admin hash) is also committed publicly.
   - Add to .gitignore. Remove from repo.
3. Purge both from git history:
   ```
   pip install git-filter-repo
   git filter-repo --path .env --path kianben.json --invert-paths
   git push --force origin main
   ```
   (History rewrite — re-clone after.)
4. Rotating the secrets matters more than purging. Old values stay readable in forks/caches even after purge — that's why rotation is step 1.
