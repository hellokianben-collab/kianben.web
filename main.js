/* ============================================================
   KiAnben — Main Frontend JS  v4 ("Manifest" redesign)
   · Same API contract as v3 — endpoints, payloads, session keys
   · 7-day persistent login with silent server verification
   · No Font Awesome — inline SVG sprite (<use href="#i-…">)
   ============================================================ */
'use strict';

const API = '/api';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initLanes();
  initAnimations();
  initModals();
  initForms();
  loadAnnouncements();
  restoreSession();   // ← runs silently every page load
});

/* ══════════════════ 7-DAY PERSISTENT SESSION ══════════════════ */

async function restoreSession() {
  const token  = localStorage.getItem('kb_token');
  const raw    = localStorage.getItem('kb_user');
  const expiry = parseInt(localStorage.getItem('kb_expiry') || '0', 10);

  if (!token || !raw) { setNavState(null); return; }
  if (Date.now() > expiry) { clearSession(); setNavState(null); return; }

  try {
    const user = JSON.parse(raw);
    setNavState(user);
    fillProfileForm(user);
  } catch { clearSession(); setNavState(null); return; }

  // Background server verify — refreshes cached profile
  try {
    const res  = await fetch(`${API}/auth/verify`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok && data.valid) {
      saveSession(token, data.user, expiry);
      setNavState(data.user);
      fillProfileForm(data.user);
    } else {
      clearSession(); setNavState(null);
    }
  } catch { /* network error — keep cached session (offline-friendly) */ }
}

function saveSession(token, user, expiry) {
  localStorage.setItem('kb_token',  token);
  localStorage.setItem('kb_user',   JSON.stringify(user));
  localStorage.setItem('kb_expiry', String(expiry || Date.now() + 7 * 24 * 60 * 60 * 1000));
}

function clearSession() {
  ['kb_token', 'kb_user', 'kb_expiry'].forEach(k => localStorage.removeItem(k));
}

function getToken() { return localStorage.getItem('kb_token'); }

/* ══════════════════ NAV STATE ══════════════════ */

function setNavState(user) {
  const old = document.getElementById('openSignin');
  if (!old) return;
  const btn = old.cloneNode(false); // clone wipes old listeners

  if (user) {
    const first = (user.fullName || 'Member').split(' ')[0];
    btn.classList.add('is-auth');
    btn.innerHTML = `<svg class="ic ic-sm" aria-hidden="true"><use href="#i-user-circle"/></svg> ${esc(first)}`;
    btn.addEventListener('click', () => {
      const n = document.getElementById('dashName');
      const e = document.getElementById('dashEmail');
      if (n) n.textContent = `Welcome, ${user.fullName || ''}!`;
      if (e) e.textContent = user.email || '';
      const av = document.getElementById('dashAvatar');
      if (av) av.textContent = (user.fullName || 'M')[0].toUpperCase();
      openModal('dashboardModal');
    });
  } else {
    btn.classList.remove('is-auth');
    btn.innerHTML = `<svg class="ic ic-sm" aria-hidden="true"><use href="#i-user"/></svg> Sign in`;
    btn.addEventListener('click', () => openModal('signinModal'));
  }
  old.replaceWith(btn);
}

/* ══════════════════ NAVBAR ══════════════════ */

function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    updateActiveLink();
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('.nav-link').forEach(l =>
    l.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    })
  );
}

function updateActiveLink() {
  const y = window.scrollY + 100;
  document.querySelectorAll('section[id]').forEach(sec => {
    const a = document.querySelector(`.nav-link[href="#${sec.id}"]`);
    if (a) a.classList.toggle('active', y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight);
  });
}

/* ══════════════════ LANES TICKER — duplicate track for seamless loop ══ */

function initLanes() {
  const track = document.getElementById('lanesTrack');
  if (!track) return;
  track.innerHTML += track.innerHTML; // two copies → -50% translate loops cleanly
}

/* ══════════════════ SCROLL ANIMATIONS ══════════════════ */

function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 80); obs.unobserve(e.target); }
    });
  }, { threshold: .1 });

  document.querySelectorAll('.svc,.plan,.why,.step,.ann-item,.about-points li').forEach(el => {
    el.classList.add('reveal'); obs.observe(el);
  });
}

/* ══════════════════ MODALS ══════════════════ */

function initModals() {
  document.getElementById('closeSignin')?.addEventListener('click',            () => closeModal('signinModal'));
  document.getElementById('closeAnnouncementModal')?.addEventListener('click', () => closeModal('announcementModal'));
  document.getElementById('closeDashboard')?.addEventListener('click',         () => closeModal('dashboardModal'));

  // close buttons with data-close (profile / quote)
  document.querySelectorAll('.js-close').forEach(b =>
    b.addEventListener('click', () => closeModal(b.dataset.close))
  );

  // every quote-open trigger
  document.querySelectorAll('.js-open-quote, #openQuoteModal').forEach(b =>
    b.addEventListener('click', () => openModal('quoteModal'))
  );

  document.getElementById('openAnnouncementModal')?.addEventListener('click', () => openModal('announcementModal'));

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    clearSession(); closeModal('dashboardModal'); setNavState(null);
    showToast('You have been signed out.', 'success');
  });

  document.getElementById('goToJoin')?.addEventListener('click', e => {
    e.preventDefault(); closeModal('signinModal');
    document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('dashViewAnnounce')?.addEventListener('click', () => {
    closeModal('dashboardModal');
    document.getElementById('announcements')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('openProfileEdit')?.addEventListener('click', () => {
    closeModal('dashboardModal'); openModal('profileModal');
  });

  // password show/hide (event delegation, SVG icon swap)
  document.querySelectorAll('.pw-toggle').forEach(b =>
    b.addEventListener('click', () => togglePassword(b.dataset.target, b))
  );

  document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); })
  );

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
  el.querySelector('input, select, textarea, button:not(.modal-x)')?.focus({ preventScroll: true });
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
}
window.closeModal = closeModal;

/* ══════════════════ FORMS ══════════════════ */

function initForms() {
  initSignInForm();
  initJoinForm();
  initAnnouncementForm();
  initProfileForm();
  initQuoteForm();
}

const SPIN = '<span class="spin" aria-hidden="true"></span> ';

/* ── Sign In ── */
function initSignInForm() {
  const form = document.getElementById('signinForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('signinError');
    errEl.classList.add('hidden');
    const btn = form.querySelector('button[type="submit"]');
    const idle = btn.innerHTML;
    setBtn(btn, true, SPIN + 'Signing in…');

    try {
      const res  = await fetch(`${API}/auth/login`, post(Object.fromEntries(new FormData(e.target))));
      const data = await res.json();

      if (res.ok) {
        saveSession(data.token, data.user);
        closeModal('signinModal');
        form.reset();
        setBtn(btn, false, idle);
        setNavState(data.user);
        fillProfileForm(data.user);
        showToast(`Welcome back, ${data.user.fullName.split(' ')[0]}!`, 'success');
      } else {
        errEl.textContent = data.message || 'Invalid email or password.';
        errEl.classList.remove('hidden');
        setBtn(btn, false, idle);
      }
    } catch {
      errEl.textContent = 'Network error. Check your connection.';
      errEl.classList.remove('hidden');
      setBtn(btn, false, idle);
    }
  });
}

/* ── Join / Apply ── */
function initJoinForm() {
  const form = document.getElementById('joinForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = document.getElementById('joinSubmitBtn');
    const idle = btn.innerHTML;
    setBtn(btn, true, SPIN + 'Submitting…');

    try {
      const res  = await fetch(`${API}/members/apply`, post(Object.fromEntries(new FormData(e.target))));
      const data = await res.json();

      if (res.ok) {
        form.classList.add('hidden');
        document.getElementById('joinSuccess').classList.remove('hidden');
        showToast("Application submitted! We'll review within 24 hours.", 'success');
      } else {
        showToast(data.message || 'Something went wrong. Please try again.', 'error');
        setBtn(btn, false, idle);
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
      setBtn(btn, false, idle);
    }
  });
}

/* ── Announcement Request ── */
function initAnnouncementForm() {
  const form = document.getElementById('announcementForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('aReqError');
    errEl.classList.add('hidden');
    const btn  = form.querySelector('button[type="submit"]');
    const idle = btn.innerHTML;
    setBtn(btn, true, SPIN + 'Submitting…');

    try {
      const res  = await fetch(`${API}/announcements/request`, post(Object.fromEntries(new FormData(e.target))));
      const data = await res.json();

      if (res.ok) {
        form.classList.add('hidden');
        document.getElementById('aReqSuccess').classList.remove('hidden');
        showToast('Request submitted for admin review!', 'success');
      } else {
        errEl.textContent = data.message || 'Please try again.';
        errEl.classList.remove('hidden');
        setBtn(btn, false, idle);
      }
    } catch {
      errEl.textContent = 'Network error.';
      errEl.classList.remove('hidden');
      setBtn(btn, false, idle);
    }
  });
}

/* ── Profile Edit ── */
function initProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('profileError');
    errEl.classList.add('hidden');
    const token = getToken();
    if (!token) { closeModal('profileModal'); openModal('signinModal'); return; }

    const btn  = form.querySelector('button[type="submit"]');
    const idle = btn.innerHTML;
    setBtn(btn, true, SPIN + 'Saving…');

    try {
      const payload = Object.fromEntries(new FormData(e.target));
      const res     = await fetch(`${API}/auth/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        saveSession(token, data.user, parseInt(localStorage.getItem('kb_expiry') || '0', 10));
        const saved = document.getElementById('profileSaved');
        if (saved) { saved.classList.remove('hidden'); setTimeout(() => saved.classList.add('hidden'), 3000); }
        showToast('Profile updated!', 'success');
      } else {
        errEl.textContent = data.message || 'Failed to save. Please try again.';
        errEl.classList.remove('hidden');
      }
    } catch {
      errEl.textContent = 'Network error.';
      errEl.classList.remove('hidden');
    }

    setBtn(btn, false, idle);
  });
}

/* Pre-fill profile form with stored values */
function fillProfileForm(user) {
  if (!user) return;
  const f = document.getElementById('profileForm');
  if (!f) return;
  ['phone','business','bio','facebook','whatsapp','youtube','instagram','linkedin'].forEach(k => {
    const el = f.elements[k];
    if (el && user[k]) el.value = user[k];
  });
}

/* ══════════════════ ANNOUNCEMENTS FEED ══════════════════ */

async function loadAnnouncements() {
  const feed = document.getElementById('announcementFeed');
  if (!feed) return;

  try {
    const res  = await fetch(`${API}/announcements/published`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data.announcements?.length) {
      feed.innerHTML = data.announcements.map(annCard).join('');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 60); obs.unobserve(e.target); } });
      }, { threshold: .1 });
      feed.querySelectorAll('.ann-item.reveal').forEach(el => obs.observe(el));
    } else {
      feed.innerHTML = `<div class="no-ann">
        <svg class="ic ic-lg" aria-hidden="true"><use href="#i-megaphone"/></svg>
        <p>No announcements on file yet. Be the first to submit one.</p>
      </div>`;
    }
  } catch {
    feed.innerHTML = `<div class="no-ann">
      <svg class="ic ic-lg" aria-hidden="true"><use href="#i-alert"/></svg>
      <p>Could not load the board. Please refresh.</p>
    </div>`;
  }
}

function annCard(a) {
  const d = new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<article class="ann-item reveal">
    <div class="ann-meta"><span class="ann-badge">KIANBEN COMMUNITY</span><span class="ann-date">${d}</span></div>
    <h3 class="ann-title">${esc(a.title)}</h3>
    <p class="ann-text">${esc(a.content)}</p>
    <p class="ann-author"><svg class="ic ic-sm" aria-hidden="true"><use href="#i-user-circle"/></svg> ${esc(a.author)}</p>
  </article>`;
}

/* ── Get a Quote ── */
function initQuoteForm() {
  const form = document.getElementById('quoteForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('quoteError');
    errEl.classList.add('hidden');
    const btn  = document.getElementById('quoteSubmitBtn');
    const idle = btn.innerHTML;
    setBtn(btn, true, SPIN + 'Sending…');

    try {
      const res  = await fetch(`${API}/announcements/quote`, post(Object.fromEntries(new FormData(e.target))));
      const data = await res.json();

      if (res.ok) {
        form.classList.add('hidden');
        document.getElementById('quoteSuccess').classList.remove('hidden');
        showToast('Quote request sent! Check your email.', 'success');
      } else {
        errEl.textContent = data.message || 'Something went wrong. Please try again.';
        errEl.classList.remove('hidden');
        setBtn(btn, false, idle);
      }
    } catch {
      errEl.textContent = 'Network error. Check your connection and try again.';
      errEl.classList.remove('hidden');
      setBtn(btn, false, idle);
    }
  });
}

/* ══════════════════ HELPERS ══════════════════ */

function post(body) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function setBtn(b, d, h) { if (!b) return; b.disabled = d; b.innerHTML = h; }
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 4500);
}
function togglePassword(id, btn) {
  const inp = document.getElementById(id); if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  const use = btn?.querySelector('use');
  if (use) use.setAttribute('href', inp.type === 'password' ? '#i-eye' : '#i-eye-off');
  btn?.setAttribute('aria-label', inp.type === 'password' ? 'Show password' : 'Hide password');
}
