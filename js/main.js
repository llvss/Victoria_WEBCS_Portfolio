/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const GITHUB_USER = 'llvss';
const GITHUB_PROFILE = `https://github.com/${GITHUB_USER}`;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

/* ==========================================================================
   DATA — edit these (img: '' shows the outlined number)
   ========================================================================== */
const PROJECTS = [
  {
    t: 'Project One',
    year: '2025',
    img: '',
    d: 'Full-stack web app with a REST API, authentication and a responsive admin dashboard.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    href: '#',
    repo: '#',
  },
  {
    t: 'Project Two',
    year: '2025',
    img: '',
    d: 'UI/UX case study: user research, wireframes and a tested interactive prototype.',
    tags: ['Figma', 'UX Research'],
    href: '#',
    repo: '#',
  },
  {
    t: 'Project Three',
    year: '2024',
    img: '',
    d: 'Algorithms and data-structure toolkit for a programming course, fully unit tested.',
    tags: ['TypeScript', 'Vitest'],
    href: '#',
    repo: '#',
  },
  {
    t: 'Project Four',
    year: '2024',
    img: '',
    d: 'Hackathon build: a working demo shipped in a single weekend with a small team.',
    tags: ['Hackathon', 'API'],
    href: '#',
    repo: '#',
  },
];

const AFFS = [
  {
    n: 'Organization One',
    r: 'Member — Web Development Committee',
    y: '2025 — Now',
    d: 'Building and maintaining internal web tools, reviewing pull requests and running onboarding sessions.',
  },
  {
    n: 'Organization Two',
    r: 'Member — IT Student Society',
    y: '2024 — Now',
    d: 'Helping organise tech talks, study groups and the annual campus coding challenge.',
  },
  {
    n: 'Organization Three',
    r: 'Participant — Hackathon Community',
    y: '2025',
    d: 'Teaming up for weekend builds, shipping prototypes and demoing under time pressure.',
  },
];

const SOCIALS = [
  { n: 'GitHub', u: GITHUB_PROFILE, h: '@llvss' },
  { n: 'LinkedIn', u: 'https://www.linkedin.com/', h: 'in/username' },
  { n: 'Instagram', u: 'https://www.instagram.com/', h: '@username' },
  { n: 'Email', copy: 'hello@lovenvictoria.dev', h: 'Copy address ⧉' },
];

const EXPERIENCE = [
  {
    y: '2026 — Now',
    r: 'Fullstack Developer (Intern)',
    w: 'Tech Company — Manila, PH',
    d: 'Building and shipping features end to end, from database schema to the interface, inside an agile team.',
  },
  {
    y: '2025 — 2026',
    r: 'Web Development Lead',
    w: 'University Org — Manila, PH',
    d: 'Led a small team building internal web tools, ran code reviews and onboarded new members.',
  },
  {
    y: '2024 — 2025',
    r: 'Frontend Developer (Part-time)',
    w: 'Freelance / Remote',
    d: 'Delivered client sites and dashboards, from wireframes through deployment and handoff.',
  },
];

const RECOMMENDATIONS = [
  {
    img: '',
    n: 'Alex Rivera',
    r: 'Engineering Manager, Tech Company',
    q: 'Reliable end to end. Takes a vague requirement and turns it into something shipped, tested and easy for the rest of the team to maintain.',
  },
  {
    img: '',
    n: 'Jamie Cruz',
    r: 'Team Lead, University Org',
    q: 'The person everyone asks when a project needs rescuing. Calm under deadline pressure and genuinely good at breaking work down.',
  },
  {
    img: '',
    n: 'Sam Patel',
    r: 'Product Designer, Freelance',
    q: 'Understands design intent properly and pushes back with better ideas. Our cleanest handover of any collaborator so far.',
  },
];

const STACKS = [
  {
    n: 'Frontend',
    d: 'Interfaces, component systems and design tokens.',
    t: ['TypeScript', 'React', 'Next.js', 'CSS', 'Tailwind'],
  },
  {
    n: 'Backend',
    d: 'APIs, data modelling and auth.',
    t: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'REST'],
  },
  {
    n: 'Tooling',
    d: 'Build, test and ship workflow.',
    t: ['Git', 'Vite', 'Vitest', 'Docker', 'CI/CD'],
  },
  {
    n: 'Practices',
    d: 'How the work gets planned and reviewed.',
    t: ['Agile', 'Code Review', 'Testing', 'Accessibility'],
  },
];

/* ==========================================================================
   RENDER
   ========================================================================== */
function box(p, i, c) {
  const media = p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.t)} screenshot" loading="lazy">`
    : `<div class="big">0${i + 1}</div>`;

  return `
    <article class="bx ${c}">
      <div class="mt"><span>0${i + 1}</span><span>${p.year}</span></div>
      ${media}
      <h3>${p.t}</h3>
      <p>${p.d}</p>
      <div class="tg">${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="lk">
        <a href="${p.href}" data-c>Live ↗</a>
        <a href="${p.repo}" data-c>Code ↗</a>
      </div>
    </article>`;
}

function renderAll() {
  const P = PROJECTS;

  $('#pg').innerHTML = `
    <div class="bento">
      ${box(P[0], 0, 'lg2')}
      <div class="col">
        ${box(P[1], 1, '')}
        <div class="pair">
          ${box(P[2], 2, 'sm')}
          ${box(P[3], 3, 'sm')}
        </div>
      </div>
    </div>`;

  $('#al').innerHTML = AFFS.map(
    (a, i) => `
    <article class="af">
      <span class="n">0${i + 1}</span>
      <div><h3>${a.n}</h3><p class="dm">${a.r}</p></div>
      <p class="dm">${a.d}</p>
      <span class="tag">${a.y}</span>
    </article>`
  ).join('');

  $('#sl').innerHTML = SOCIALS.map((s) =>
    s.copy
      ? `<button class="so" data-email="${s.copy}" data-c>${s.n}<span>${s.h}</span></button>`
      : `<a class="so" href="${s.u}" target="_blank" rel="noopener" data-c>${s.n}<span>${s.h} ↗</span></a>`
  ).join('');

  $('#ts').innerHTML = STACKS.map(
    (s) => `
    <div class="sk">
      <div class="hd"><h3>${esc(s.n)}</h3><p class="dm">${esc(s.d)}</p></div>
      <div class="tg">${s.t.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>`
  ).join('');

  $('#ex').innerHTML = EXPERIENCE.map(
    (e) => `
    <article class="ex">
      <span class="y">${esc(e.y)}</span>
      <div>
        <h3>${esc(e.r)}</h3>
        <p class="dm">${esc(e.w)}</p>
      </div>
      <p class="dm">${esc(e.d)}</p>
    </article>`
  ).join('');

  $('#rc').innerHTML = RECOMMENDATIONS.map(
    (r) => `
    <article class="rc">
      ${
        r.img
          ? `<img class="av" src="${esc(r.img)}" alt="${esc(r.n)}" loading="lazy">`
          : '<div class="av ph" aria-hidden="true"></div>'
      }
      <h3>${esc(r.n)}</h3>
      <p class="dm">${esc(r.r)}</p>
      <blockquote>${esc(r.q)}</blockquote>
    </article>`
  ).join('');
}

/* ==========================================================================
   GITHUB CONTRIBUTION GRAPH
   ========================================================================== */
function renderGraph(contributions, total, publicRepos) {
  const W = 53;
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const byDate = new Map(contributions.map((day) => [day.date, day]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const st = new Date(today);
  st.setDate(st.getDate() - (W * 7 - 1));
  st.setDate(st.getDate() - st.getDay());

  let h = '';
  let mh = '';
  let tot = 0;
  let lm = -1;
  const days = [];

  for (let w = 0; w < W; w++) {
    const wk = new Date(st);
    wk.setDate(st.getDate() + w * 7);
    mh += `<span>${wk.getMonth() !== lm ? M[wk.getMonth()] : ''}</span>`;
    lm = wk.getMonth();

    for (let d = 0; d < 7; d++) {
      const dt = new Date(st);
      dt.setDate(st.getDate() + w * 7 + d);

      if (dt > today) {
        h += '<i class="c e"></i>';
        continue;
      }

      const key = [
        dt.getFullYear(),
        String(dt.getMonth() + 1).padStart(2, '0'),
        String(dt.getDate()).padStart(2, '0'),
      ].join('-');
      const entry = byDate.get(key);
      const n = entry ? entry.count : 0;
      const l = entry ? entry.level : 0;
      tot += n;
      days.push(n);

      const label = dt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      h += `<i class="c l${l}" data-n="${n}" data-d="${label}"></i>`;
    }
  }

  $('#gc').innerHTML = h;
  $('#gm').innerHTML = mh;

  // Streaks
  let run = 0;
  let lg = 0;
  let cur = 0;
  days.forEach((n) => {
    if (n > 0) {
      run++;
      lg = Math.max(lg, run);
    } else {
      run = 0;
    }
  });
  for (let i = days.length - 1; i >= 0 && days[i] > 0; i--) cur++;

  $('#gt').textContent = total.toLocaleString() + ' in the last year';
  $('#gst').innerHTML = [
    [total.toLocaleString(), 'Contributions'],
    [cur, 'Current streak'],
    [lg, 'Longest streak'],
    [publicRepos, 'Public repos'],
  ]
    .map((a) => `<div class="stat"><b>${a[0]}</b><span>${a[1]}</span></div>`)
    .join('');

  // Tooltip
  const tip = $('#tip');
  const gc = $('#gc');

  gc.addEventListener('pointerover', (e) => {
    const c = e.target.closest('.c');
    if (!c || !c.dataset.d) {
      tip.style.display = 'none';
      return;
    }
    tip.textContent = `${c.dataset.n} contributions · ${c.dataset.d}`;
    tip.style.display = 'block';
  });

  gc.addEventListener('pointermove', (e) => {
    tip.style.left = e.clientX + 'px';
    tip.style.top = e.clientY + 'px';
  });

  gc.addEventListener('pointerleave', () => (tip.style.display = 'none'));
}

async function graph() {
  const contributionsUrl = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`;
  const userUrl = `https://api.github.com/users/${GITHUB_USER}`;

  try {
    const [contributionResponse, userResponse] = await Promise.all([
      fetch(contributionsUrl),
      fetch(userUrl),
    ]);

    if (!contributionResponse.ok || !userResponse.ok) {
      throw new Error('GitHub data unavailable');
    }

    const contributionData = await contributionResponse.json();
    const userData = await userResponse.json();
    renderGraph(
      contributionData.contributions,
      contributionData.total.lastYear,
      userData.public_repos
    );
  } catch (error) {
    $('#gt').textContent = 'unavailable';
  }
}

/* ==========================================================================
   DITHERED ART — the object turns as you move the cursor
   ========================================================================== */
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

let DW = 0;
let DH = 0;
let ang = 0.42;
const S = 5;
const cv = $('#dz');
const cx = cv.getContext('2d');

function fit() {
  DW = Math.ceil(cv.clientWidth / S);
  DH = Math.ceil(cv.clientHeight / S);
  cv.width = DW * S;
  cv.height = DH * S;
  draw();
}

function draw() {
  cx.clearRect(0, 0, cv.width, cv.height);
  cx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ink').trim();
  cx.globalAlpha = 0.3;

  const co = Math.cos(ang);
  const si = Math.sin(ang);

  for (let y = 0; y < DH; y++) {
    for (let x = 0; x < DW; x++) {
      const a = (x - DW * 0.62) / DH;
      const b = (y - DH * 0.5) / DH;
      const u = a * co + b * si;
      const v = -a * si + b * co;
      let val = 0;

      if (Math.abs(u) < 0.06 && Math.abs(v) < 0.7) val = 0.55;
      if (Math.abs(u) < 0.3 && v > -0.05 && v < 0.3) val = 0.8;
      if (Math.abs(u) < 0.22 && v > 0.03 && v < 0.22) val = 0.28;
      if (Math.abs(u + 0.03) < 0.17 && v > -0.32 && v < -0.14) val = 0.65;
      if (Math.abs(u - 0.13) < 0.04 && v > 0.3 && v < 0.6) val = 0.7;

      val *= 0.6 + 0.4 * (0.5 - u);

      if (val > BAY[(y & 3) * 4 + (x & 3)]) cx.fillRect(x * S, y * S, S, S);
    }
  }
}

let pend = false;
function turn(mx, my) {
  ang = 0.42 + (mx / innerWidth - 0.5) * 1.3 - (my / innerHeight - 0.5) * 0.4;
  if (!pend) {
    pend = true;
    requestAnimationFrame(() => {
      pend = false;
      draw();
    });
  }
}

/* ==========================================================================
   CURSOR GUIDES
   ========================================================================== */
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

if (fine) {
  addEventListener(
    'pointermove',
    (e) => {
      const gx = $('#gx');
      const gy = $('#gy');
      const ro = $('#ro');

      gx.style.display = gy.style.display = ro.style.display = 'block';
      gx.style.top = e.clientY + 'px';
      gy.style.left = e.clientX + 'px';
      ro.textContent = `X ${String(e.clientX).padStart(4, '0')} · Y ${String(e.clientY).padStart(4, '0')}`;
      turn(e.clientX, e.clientY);
    },
    { passive: true }
  );
}

/* ==========================================================================
   NAV STATE (scroll spy + progress rail)
   ========================================================================== */
function spy() {
  const ids = ['home', 'projects', 'experience', 'affiliations', 'github', 'recommendations', 'socials'];
  const ln = ids.map((i) => [i, $(`nav a[href="#${i}"]`)]);
  const rail = $('#rail');
  let t = false;

  const up = () => {
    t = false;
    const pr = scrollY + innerHeight * 0.4;
    let a = ids[0];

    for (const i of ids) {
      const el = document.getElementById(i);
      if (el && el.offsetTop <= pr) a = i;
    }

    if (innerHeight + scrollY >= document.body.scrollHeight - 4) a = ids[ids.length - 1];

    ln.forEach(([i, el]) => el && el.classList.toggle('on', i === a));

    const m = document.body.scrollHeight - innerHeight;
    rail.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, scrollY / m) : 0) + ')';
  };

  const f = () => {
    if (!t) {
      t = true;
      requestAnimationFrame(up);
    }
  };

  addEventListener('scroll', f, { passive: true });
  addEventListener('resize', f, { passive: true });
  up();
}

/* ==========================================================================
   THEME
   ========================================================================== */
const icons = {
  soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6"/><path d="m17 9 6 6"/></svg>',
  system: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8"/><path d="M12 16v4"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/></svg>',
};

const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let theme = 'system';
try {
  theme = localStorage.getItem('lv-theme') || 'system';
} catch (_) {}

function setTheme(t) {
  theme = t;
  try {
    localStorage.setItem('lv-theme', t);
  } catch (_) {}
  syncTheme();
}

function syncTheme() {
  const resolvedTheme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;

  document.documentElement.dataset.t = resolvedTheme;

  // Logo artwork is inverted per theme: the light-theme mark is dark-on-light,
  // so it only reads correctly on a light background (and vice versa).
  const logo = $('.logo');
  if (logo) {
    const src = `/public/img/logo-${resolvedTheme}.png`;
    if (logo.getAttribute('src') !== src) logo.setAttribute('src', src);
  }

  $$('.theme-option').forEach((button) => {
    const active = button.dataset.theme === theme;
    button.innerHTML = icons[button.dataset.theme];
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  draw();
}

$$('.theme-option').forEach((button) => {
  button.addEventListener('click', () => {
    setTheme(button.dataset.theme);
  });
});

systemTheme.addEventListener('change', () => {
  if (theme === 'system') syncTheme();
});

/* ==========================================================================
   CLACK SOUND
   ========================================================================== */
let actx = null;
let muted = false;
try {
  muted = localStorage.getItem('lv-muted') === '1';
} catch (_) {}

function clack() {
  if (muted) return;

  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();

    const t = actx.currentTime;
    const len = Math.floor(actx.sampleRate * 0.035);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);

    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5);

    // Noise burst
    const s = actx.createBufferSource();
    s.buffer = buf;

    const bp = actx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2200;
    bp.Q.value = 1.1;

    const g = actx.createGain();
    g.gain.value = 0.26;

    s.connect(bp).connect(g).connect(actx.destination);
    s.start(t);

    // Low thump
    const o = actx.createOscillator();
    const og = actx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.05);
    og.gain.setValueAtTime(0.1, t);
    og.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);

    o.connect(og).connect(actx.destination);
    o.start(t);
    o.stop(t + 0.07);
  } catch (_) {}
}

document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button,[data-c],.bx,.af,.rp,.so')) clack();
});

/* ==========================================================================
   HOVER SFX
   -------------------------------------------------------------------------- */
/* Every button (and the button-like elements that share their look) plays
   public/sfx/button-hover.mp3 on hover. Reuses the existing `muted` flag so
   the #mu toggle silences hovers too. */
const HOVER_SFX_SRC = '/public/sfx/button-hover.mp3';
const HOVER_SFX_VOL = 0.35;
const HOVER_SFX_GAP = 60; // ms — stops machine-gunning when sweeping across a row
const HOVER_SEL = 'button,[data-c],.bx,.af,.rp,.so';

const hoverSfx = new Audio(HOVER_SFX_SRC);
hoverSfx.preload = 'auto';
hoverSfx.volume = HOVER_SFX_VOL;

let hoverAt = 0;

function hoverPlay() {
  if (muted) return;
  const now = performance.now();
  if (now - hoverAt < HOVER_SFX_GAP) return;
  hoverAt = now;
  try {
    hoverSfx.currentTime = 0;
    hoverSfx.play().catch(() => {});
  } catch (_) {}
}

if (fine) {
  // pointerover bubbles (pointerenter does not), so one delegated listener
  // covers every button, including ones rendered later by main.js.
  document.addEventListener(
    'pointerover',
    (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest(HOVER_SEL);
      if (!el) return;
      // Ignore moves that stay inside the same button (e.g. onto a child span).
      if (el.contains(e.relatedTarget)) return;
      hoverPlay();
    },
    { passive: true }
  );

  // Keyboard users get the same feedback when tabbing to a button.
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest(HOVER_SEL);
    if (el && el.matches(':focus-visible')) hoverPlay();
  });

  // Autoplay policies block audio until a gesture; unlock it silently so the
  // very first hover is not swallowed.
  const unlock = () => {
    if (muted) return;
    try {
      const p = hoverSfx.play();
      hoverSfx.pause();
      hoverSfx.currentTime = 0;
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  };
  addEventListener('pointerdown', unlock, { once: true, passive: true });
  addEventListener('keydown', unlock, { once: true, passive: true });
  addEventListener('touchstart', unlock, { once: true, passive: true });
}

const mu = $('#mu');
const syncMu = () => {
  mu.setAttribute('aria-pressed', String(muted));
  mu.innerHTML = muted ? icons.soundOff : icons.soundOn;
  const label = muted ? 'Sound off' : 'Sound on';
  mu.setAttribute('aria-label', label);
  mu.title = label;
};

mu.addEventListener('click', () => {
  muted = !muted;
  try {
    localStorage.setItem('lv-muted', muted ? '1' : '0');
  } catch (_) {}
  syncMu();
});
syncMu();

/* ==========================================================================
   COPY EMAIL + TOAST
   ========================================================================== */
let tt;
function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('show'), 2200);
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-email]');

  if (b) {
    const v = b.dataset.email;
    try {
      await navigator.clipboard.writeText(v);
      toast('Copied to clipboard!');
    } catch (_) {
      // Fallback for browsers/contexts without the async clipboard API
      const ta = document.createElement('textarea');
      ta.value = v;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast('Copied to clipboard!');
      } catch (__) {
        toast(v);
      }
      ta.remove();
    }
  }

  if (e.target.closest('a[href="#"]')) e.preventDefault();
});

/* ==========================================================================
   CURSOR GLOW + NAME LENS
   ========================================================================== */
(function () {
  if (!fine) return;

  const glow = $('#glow');
  const lens = $('#lens');
  const nm = $('.name');
  const R = 95;
  const rm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  let mx = 0, my = 0;
  let gx = 0, gy = 0;
  let lx = 0, ly = 0;
  let ls = 0, lt = 0;
  let seen = false;
  let run = false;

  const kg = rm ? 1 : 0.12;
  const kl = rm ? 1 : 0.22;
  const ks = rm ? 1 : 0.16;

  function frame() {
    gx += (mx - gx) * kg;
    gy += (my - gy) * kg;
    lx += (mx - lx) * kl;
    ly += (my - ly) * kl;
    ls += (lt - ls) * ks;

    glow.style.transform = 'translate3d(' + (gx - 280) + 'px,' + (gy - 280) + 'px,0)';
    lens.style.transform = 'translate3d(' + (lx - R) + 'px,' + (ly - R) + 'px,0) scale(' + ls + ')';
    lens.style.opacity = Math.min(1, ls * 1.5);
    lens.style.visibility = ls < 0.01 ? 'hidden' : 'visible';

    const busy =
      Math.abs(mx - gx) > 0.1 ||
      Math.abs(my - gy) > 0.1 ||
      Math.abs(lt - ls) > 0.004 ||
      (ls > 0.01 && (Math.abs(mx - lx) > 0.1 || Math.abs(my - ly) > 0.1));

    if (busy) requestAnimationFrame(frame);
    else run = false;
  }

  const kick = () => {
    if (!run) {
      run = true;
      requestAnimationFrame(frame);
    }
  };

  addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!seen) {
        seen = true;
        gx = lx = mx;
        gy = ly = my;
        glow.style.opacity = 1;
      }
      kick();
    },
    { passive: true }
  );

  document.documentElement.addEventListener('pointerleave', () => {
    glow.style.opacity = 0;
    lt = 0;
    kick();
  });

  document.documentElement.addEventListener('pointerenter', () => {
    if (seen) glow.style.opacity = 1;
  });

  nm.addEventListener('pointerenter', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (ls < 0.01) {
      lx = mx;
      ly = my;
    }
    lt = 1;
    kick();
  });

  nm.addEventListener('pointerleave', () => {
    lt = 0;
    kick();
  });
})();

/* ==========================================================================
   INIT
   ========================================================================== */
syncTheme();

function alignProjectGuide() {
  const guide = $('.v2');
  const projects = $('#projects');
  if (guide && projects) guide.style.top = `${projects.offsetTop}px`;
}

[renderAll, graph, spy, fit, alignProjectGuide].forEach((f) => {
  try {
    f();
  } catch (err) {
    console.error(f.name, err);
  }
});

addEventListener('resize', fit);
addEventListener('resize', alignProjectGuide);
document.fonts?.ready.then(alignProjectGuide);
