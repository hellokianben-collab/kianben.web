# KiAnben v3 — "Deep Harbor" (premium dark glass)

Drop-in replacement: `index.html`, `styles.css`, `main.js` → repo root → push → Railway deploys.
Content, copy, forms, API — identical to previous version. Visuals only.

## The look
- Premium dark theme (#04070E) with cyan brand glow + violet/teal aurora gradients
- Glassmorphism everywhere: backdrop-blur cards, frosted floating nav, glass modals
- Interactive 3D tilt + moving glare on cards (waybill, services, plans, ledger, panel) — responds to mouse
- Ambient particle field with connective lines (canvas, GPU-friendly)
- Parallax aurora blobs + hero seal drift on scroll
- Animated gradient headlines, glowing horizon line, floating waybill document
- Hero load-in choreography, scroll reveals with blur, animated counters (1% / 15+ / 24h)
- Button ripples, hover micro-interactions, glowing "MOST CHOSEN" gradient-border plan
- Fonts: Space Grotesk (display) · Inter (body) · IBM Plex Mono (codes/labels)

## Performance & safety
- Zero libraries. Vanilla JS, one canvas.
- rAF-throttled mouse/scroll handlers; particles pause on hidden tab; DPR capped at 2; fewer particles on mobile
- prefers-reduced-motion: all animation, tilt, particles, aurora disabled
- Tilt disabled on touch devices (hover:none)
- Mobile-first responsive; same a11y as v2 (skip link, aria-modal, role=alert, focus rings, 44px+ targets)

## Unchanged (guaranteed)
- All API endpoints, payloads, form names/IDs, session keys (kb_token/kb_user/kb_expiry), admin panel.

## Security reminder (still open from last review)
Rotate the leaked Gmail app password + JWT secrets + admin password, and purge `.env` + `kianben.json` from git history. Steps in previous README-REDESIGN.md.
