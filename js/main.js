/* ==========================================================================
   Helpers
   ========================================================================== */
const query = (selector, root = document) => root.querySelector(selector);
const queryAll = (selector, root = document) => [...root.querySelectorAll(selector)];
const GITHUB_USER = 'llvss';

const THEME_STORAGE_KEY = 'lv-theme';
const MUTED_STORAGE_KEY = 'lv-muted';
const CLICK_SFX_SRC = '/public/sfx/button-click.mp3';
const CLICK_SFX_VOL = 0.3;
const CLICK_SFX_GAP = 40; // ms — stops machine-gunning on rapid repeat clicks
const HOVER_SFX_SRC = '/public/sfx/button-hover.mp3';
const HOVER_SFX_VOL = 0.35;
const HOVER_SFX_GAP = 60; // ms — stops machine-gunning when sweeping across a row

// Anything that should react to click and hover feedback.
const CLICKABLE_SELECTOR = 'button,[data-c],.bx,.af,.so';
const HOVER_SFX_SELECTOR = CLICKABLE_SELECTOR;

/* ==========================================================================
   GITHUB CONTRIBUTION GRAPH
   ========================================================================== */
function renderGraph(contributions, total, publicRepos) {
  // Only the Activity page carries the graph markup.
  const graphGrid = query('#gc');
  if (!graphGrid) return;

  const WEEKS = 53;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const byDate = new Map(contributions.map((day) => [day.date, day]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start of the grid: WEEKS*7 days back, rewound to the previous Sunday.
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - (WEEKS * 7 - 1));
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  let cells = '';
  let monthLabels = '';
  let contributionsTotal = 0;
  let lastMonthIndex = -1;
  const dailyCounts = [];

  for (let week = 0; week < WEEKS; week++) {
    const weekStart = new Date(gridStart);
    weekStart.setDate(gridStart.getDate() + week * 7);
    monthLabels += `<span>${
      weekStart.getMonth() !== lastMonthIndex ? MONTHS[weekStart.getMonth()] : ''
    }</span>`;
    lastMonthIndex = weekStart.getMonth();

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayDate = new Date(gridStart);
      dayDate.setDate(gridStart.getDate() + week * 7 + dayOfWeek);

      if (dayDate > today) {
        cells += '<i class="c e"></i>';
        continue;
      }

      const dateKey = [
        dayDate.getFullYear(),
        String(dayDate.getMonth() + 1).padStart(2, '0'),
        String(dayDate.getDate()).padStart(2, '0'),
      ].join('-');
      const entry = byDate.get(dateKey);
      const count = entry ? entry.count : 0;
      const level = entry ? entry.level : 0;
      contributionsTotal += count;
      dailyCounts.push(count);

      const label = dayDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      cells += `<i class="c l${level}" data-n="${count}" data-d="${label}"></i>`;
    }
  }

  query('#gc').innerHTML = cells;
  query('#gm').innerHTML = monthLabels;

  // Streaks
  let runningStreak = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  dailyCounts.forEach((count) => {
    if (count > 0) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  });
  for (let day = dailyCounts.length - 1; day >= 0 && dailyCounts[day] > 0; day--) currentStreak++;

  const totalLabel = query('#gt');
  if (totalLabel) totalLabel.textContent = total.toLocaleString() + ' in the last year';

  const statGrid = query('#gst');
  if (statGrid) {
    statGrid.innerHTML = [
      [total.toLocaleString(), 'Contributions'],
      [currentStreak, 'Current streak'],
      [longestStreak, 'Longest streak'],
      [publicRepos, 'Public repos'],
    ]
      .map(([value, caption]) => `<div class="stat"><b>${value}</b><span>${caption}</span></div>`)
      .join('');
  }

  // Tooltip
  const tip = query('#tip');
  if (!tip) return;

  graphGrid.addEventListener('pointerover', (event) => {
    const cell = event.target.closest('.c');
    if (!cell || !cell.dataset.d) {
      tip.style.display = 'none';
      return;
    }
    tip.textContent = `${cell.dataset.n} contributions · ${cell.dataset.d}`;
    tip.style.display = 'block';
  });

  graphGrid.addEventListener('pointermove', (event) => {
    tip.style.left = event.clientX + 'px';
    tip.style.top = event.clientY + 'px';
  });

  graphGrid.addEventListener('pointerleave', () => (tip.style.display = 'none'));
}

async function graph() {
  if (!query('#gc')) return;

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
    const totalLabel = query('#gt');
    if (totalLabel) totalLabel.textContent = 'unavailable';
  }
}

/* ==========================================================================
   DITHERED ART — the object turns as you move the cursor
   ========================================================================== */
/* 4x4 ordered-dither threshold matrix, normalised to 0..1 */
const BAYER_THRESHOLDS = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (value) => (value + 0.5) / 16
);

let gridWidth = 0;
let gridHeight = 0;
let angle = 0.42;
const PIXEL_SIZE = 5;
// Only the home page carries the dithered hero canvas.
const canvas = query('#dz');
const context = canvas ? canvas.getContext('2d') : null;

function fit() {
  if (!canvas) return;

  gridWidth = Math.ceil(canvas.clientWidth / PIXEL_SIZE);
  gridHeight = Math.ceil(canvas.clientHeight / PIXEL_SIZE);
  canvas.width = gridWidth * PIXEL_SIZE;
  canvas.height = gridHeight * PIXEL_SIZE;
  draw();
}

function draw() {
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = getComputedStyle(document.body).getPropertyValue('--ink').trim();
  context.globalAlpha = 0.3;

  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  for (let row = 0; row < gridHeight; row++) {
    for (let column = 0; column < gridWidth; column++) {
      // Rotate into the object's local space, then apply the silhouette rules.
      const localX = (column - gridWidth * 0.62) / gridHeight;
      const localY = (row - gridHeight * 0.5) / gridHeight;
      const rotatedX = localX * cosAngle + localY * sinAngle;
      const rotatedY = -localX * sinAngle + localY * cosAngle;
      let shade = 0;

      if (Math.abs(rotatedX) < 0.06 && Math.abs(rotatedY) < 0.7) shade = 0.55;
      if (Math.abs(rotatedX) < 0.3 && rotatedY > -0.05 && rotatedY < 0.3) shade = 0.8;
      if (Math.abs(rotatedX) < 0.22 && rotatedY > 0.03 && rotatedY < 0.22) shade = 0.28;
      if (Math.abs(rotatedX + 0.03) < 0.17 && rotatedY > -0.32 && rotatedY < -0.14) shade = 0.65;
      if (Math.abs(rotatedX - 0.13) < 0.04 && rotatedY > 0.3 && rotatedY < 0.6) shade = 0.7;

      shade *= 0.6 + 0.4 * (0.5 - rotatedX);

      if (shade > BAYER_THRESHOLDS[(row & 3) * 4 + (column & 3)]) {
        context.fillRect(column * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }
}

let drawQueued = false;
function turn(pointerX, pointerY) {
  angle = 0.42 + (pointerX / innerWidth - 0.5) * 1.3 - (pointerY / innerHeight - 0.5) * 0.4;
  if (!drawQueued) {
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      draw();
    });
  }
}

// The dither is painted in a flat --ink colour, so it cannot interpolate on its
// own. While the palette morphs it would keep the old ink, so repaint once the
// --ink transition lands on its final value.
document.documentElement.addEventListener('transitionend', (event) => {
  if (event.target === document.documentElement && event.propertyName === '--ink') draw();
});

/* ==========================================================================
   CURSOR GUIDES
   ========================================================================== */
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;

if (finePointer) {
  addEventListener(
    'pointermove',
    (event) => {
      const guideVertical = query('#gx');
      const guideHorizontal = query('#gy');
      const readout = query('#ro');

      guideVertical.style.display = guideHorizontal.style.display = readout.style.display = 'block';
      guideVertical.style.top = event.clientY + 'px';
      guideHorizontal.style.left = event.clientX + 'px';
      readout.textContent = `X ${String(event.clientX).padStart(4, '0')} · Y ${String(
        event.clientY
      ).padStart(4, '0')}`;
      turn(event.clientX, event.clientY);
    },
    { passive: true }
  );
}

/* ==========================================================================
   NAV STATE (active page + progress rail)
   --------------------------------------------------------------------------
   Every nav item is its own page now, so the "active" link is resolved from
   the current filename instead of from the scroll position. The progress rail
   still tracks scroll, but within the current page.
   ========================================================================== */
// Resolves to e.g. "index.html" for both "/" and "/index.html", so the site
// works when opened straight from the filesystem as well as from a server.
function currentPageFile() {
  const lastSegment = location.pathname.split('/').filter(Boolean).pop();
  return (lastSegment || 'index.html').toLowerCase();
}

function spy() {
  const activeFile = currentPageFile();
  const rail = query('#rail');

  queryAll('nav a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkFile = (href.split('/').filter(Boolean).pop() || 'index.html').toLowerCase();
    link.classList.toggle('on', linkFile === activeFile);
  });

  let updateQueued = false;

  const update = () => {
    updateQueued = false;
    if (!rail) return;
    const maxScroll = document.body.scrollHeight - innerHeight;
    rail.style.transform = 'scaleX(' + (maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0) + ')';
  };

  const scheduleUpdate = () => {
    if (!updateQueued) {
      updateQueued = true;
      requestAnimationFrame(update);
    }
  };

  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate, { passive: true });
  update();
}

/* ==========================================================================
   THEME
   ========================================================================== */
const THEME_ICONS = {
  soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6"/><path d="m17 9 6 6"/></svg>',
  system: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8"/><path d="M12 16v4"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/></svg>',
};

const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let theme = 'system';
try {
  theme = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
} catch (error) {}

function setTheme(nextTheme) {
  theme = nextTheme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {}
  // The morph itself is a CSS transition on the palette, so there is nothing
  // to orchestrate here - just apply the new values and let them blend.
  syncTheme();
}

function resolveTheme() {
  return theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
}

function syncTheme() {
  const resolvedTheme = resolveTheme();

  document.documentElement.dataset.t = resolvedTheme;

  // Logo artwork is inverted per theme: the light-theme mark is dark-on-light,
  // so it only reads correctly on a light background (and vice versa).
  const logo = query('.logo');
  if (logo) {
    const source = `/public/img/logo-${resolvedTheme}.png`;
    if (logo.getAttribute('src') !== source) logo.setAttribute('src', source);
  }

  queryAll('.theme-option').forEach((button) => {
    const isActive = button.dataset.theme === theme;
    button.innerHTML = THEME_ICONS[button.dataset.theme];
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  draw();
}

queryAll('.theme-option').forEach((button) => {
  button.addEventListener('click', () => {
    setTheme(button.dataset.theme);
  });
});

systemTheme.addEventListener('change', () => {
  // The OS flipped while the user is on "system" — let the palette morph too.
  if (theme === 'system') syncTheme();
});

/* ==========================================================================
   CLICK SOUND
   --------------------------------------------------------------------------
   Preloaded audio clip, played from one delegated pointerdown listener.
   Shares the `muted` flag, so the sound toggle silences it too. */
const clickSfx = new Audio(CLICK_SFX_SRC);
clickSfx.preload = 'auto';
clickSfx.volume = CLICK_SFX_VOL;

let muted = false;
try {
  muted = localStorage.getItem(MUTED_STORAGE_KEY) === '1';
} catch (error) {}

let lastClickAt = -Infinity;

function playClickSound() {
  if (muted) return;
  const now = performance.now();
  // -Infinity (not 0) so the very first click is never swallowed by the gap
  // check, even if it happens <40ms after page load.
  if (now - lastClickAt < CLICK_SFX_GAP) return;
  lastClickAt = now;
  try {
    clickSfx.currentTime = 0;
    clickSfx.play().catch(() => {});
  } catch (error) {}
}

document.addEventListener('pointerdown', (event) => {
  if (event.target.closest(CLICKABLE_SELECTOR)) playClickSound();
});

/* ==========================================================================
   HOVER SFX
   -------------------------------------------------------------------------- */
/* Every button (and the button-like elements that share their look) plays
   public/sfx/button-hover.mp3 on hover. Reuses the existing `muted` flag so
   the sound toggle silences hovers too. */
const hoverSfx = new Audio(HOVER_SFX_SRC);
hoverSfx.preload = 'auto';
hoverSfx.volume = HOVER_SFX_VOL;

let lastHoverAt = -Infinity;

function playHoverSound() {
  if (muted) return;
  const now = performance.now();
  if (now - lastHoverAt < HOVER_SFX_GAP) return;
  lastHoverAt = now;
  try {
    hoverSfx.currentTime = 0;
    hoverSfx.play().catch(() => {});
  } catch (error) {}
}

if (finePointer) {
  // pointerover bubbles (pointerenter does not), so one delegated listener
  // covers every button, including ones added to the page later.
  document.addEventListener(
    'pointerover',
    (event) => {
      if (event.pointerType === 'touch') return;
      const element = event.target.closest(HOVER_SFX_SELECTOR);
      if (!element) return;
      // Ignore moves that stay inside the same button (e.g. onto a child span).
      if (element.contains(event.relatedTarget)) return;
      playHoverSound();
    },
    { passive: true }
  );

  // Keyboard users get the same feedback when tabbing to a button.
  document.addEventListener('focusin', (event) => {
    const element = event.target.closest(HOVER_SFX_SELECTOR);
    if (element && element.matches(':focus-visible')) playHoverSound();
  });

  // Autoplay policies block audio until a gesture; unlock both clips silently
  // so the very first hover/click is not swallowed.
  const unlockAudio = () => {
    if (muted) return;
    for (const clip of [clickSfx, hoverSfx]) {
      try {
        const playRequest = clip.play();
        clip.pause();
        clip.currentTime = 0;
        if (playRequest && playRequest.catch) playRequest.catch(() => {});
      } catch (error) {}
    }
  };
  addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  addEventListener('keydown', unlockAudio, { once: true, passive: true });
  addEventListener('touchstart', unlockAudio, { once: true, passive: true });
}

const soundToggle = query('#mu');

if (soundToggle) {
  const syncSoundToggle = () => {
    soundToggle.setAttribute('aria-pressed', String(muted));
    soundToggle.innerHTML = muted ? THEME_ICONS.soundOff : THEME_ICONS.soundOn;
    const label = muted ? 'Sound off' : 'Sound on';
    soundToggle.setAttribute('aria-label', label);
    soundToggle.title = label;
  };

  soundToggle.addEventListener('click', () => {
    muted = !muted;
    try {
      localStorage.setItem(MUTED_STORAGE_KEY, muted ? '1' : '0');
    } catch (error) {}
    syncSoundToggle();
  });
  syncSoundToggle();
}

/* ==========================================================================
   COPY EMAIL + TOAST
   ========================================================================== */
let toastTimer;
function toast(message) {
  const element = query('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}

document.addEventListener('click', async (event) => {
  const copyTrigger = event.target.closest('[data-email]');

  if (copyTrigger) {
    const emailAddress = copyTrigger.dataset.email;
    try {
      await navigator.clipboard.writeText(emailAddress);
      toast('Copied to clipboard!');
    } catch (error) {
      // Fallback for browsers/contexts without the async clipboard API
      const fallbackInput = document.createElement('textarea');
      fallbackInput.value = emailAddress;
      fallbackInput.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(fallbackInput);
      fallbackInput.select();
      try {
        document.execCommand('copy');
        toast('Copied to clipboard!');
      } catch (copyError) {
        toast(emailAddress);
      }
      fallbackInput.remove();
    }
  }

  if (event.target.closest('a[href="#"]')) event.preventDefault();
});

/* ==========================================================================
   CURSOR GLOW + NAME LENS
   ========================================================================== */
(function () {
  if (!finePointer) return;

  const glow = query('#glow');
  const lens = query('#lens');
  const nameElement = query('.name');
  if (!glow || !lens || !nameElement) return;

  const LENS_RADIUS = 95;
  const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;

  // Target vs. current position for the glow, the lens, and the lens scale.
  let pointerX = 0;
  let pointerY = 0;
  let glowX = 0;
  let glowY = 0;
  let lensX = 0;
  let lensY = 0;
  let lensScale = 0;
  let lensTarget = 0;
  let seenPointer = false;
  let animationRunning = false;

  // Easing factors (1 = instant, lower = lazier follow).
  const glowEase = reduceMotion ? 1 : 0.12;
  const lensEase = reduceMotion ? 1 : 0.22;
  const scaleEase = reduceMotion ? 1 : 0.16;

  function frame() {
    glowX += (pointerX - glowX) * glowEase;
    glowY += (pointerY - glowY) * glowEase;
    lensX += (pointerX - lensX) * lensEase;
    lensY += (pointerY - lensY) * lensEase;
    lensScale += (lensTarget - lensScale) * scaleEase;

    glow.style.transform = 'translate3d(' + (glowX - 280) + 'px,' + (glowY - 280) + 'px,0)';
    lens.style.transform =
      'translate3d(' +
      (lensX - LENS_RADIUS) +
      'px,' +
      (lensY - LENS_RADIUS) +
      'px,0) scale(' +
      lensScale +
      ')';
    lens.style.opacity = Math.min(1, lensScale * 1.5);
    lens.style.visibility = lensScale < 0.01 ? 'hidden' : 'visible';

    const stillMoving =
      Math.abs(pointerX - glowX) > 0.1 ||
      Math.abs(pointerY - glowY) > 0.1 ||
      Math.abs(lensTarget - lensScale) > 0.004 ||
      (lensScale > 0.01 &&
        (Math.abs(pointerX - lensX) > 0.1 || Math.abs(pointerY - lensY) > 0.1));

    if (stillMoving) requestAnimationFrame(frame);
    else animationRunning = false;
  }

  const kick = () => {
    if (!animationRunning) {
      animationRunning = true;
      requestAnimationFrame(frame);
    }
  };

  addEventListener(
    'pointermove',
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!seenPointer) {
        seenPointer = true;
        glowX = lensX = pointerX;
        glowY = lensY = pointerY;
        glow.style.opacity = 1;
      }
      kick();
    },
    { passive: true }
  );

  document.documentElement.addEventListener('pointerleave', () => {
    glow.style.opacity = 0;
    lensTarget = 0;
    kick();
  });

  document.documentElement.addEventListener('pointerenter', () => {
    if (seenPointer) glow.style.opacity = 1;
  });

  nameElement.addEventListener('pointerenter', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (lensScale < 0.01) {
      lensX = pointerX;
      lensY = pointerY;
    }
    lensTarget = 1;
    kick();
  });

  nameElement.addEventListener('pointerleave', () => {
    lensTarget = 0;
    kick();
  });
})();

/* ==========================================================================
   MOBILE MENU
   --------------------------------------------------------------------------
   Below 900px the sidebar is hidden and this builds a top bar with a
   hamburger plus a full-screen drawer. The markup is generated from the
   sidebar that is already in the page, so the two can never drift apart and
   no page needs duplicate nav markup.

   Follows the pattern on bryllim.com: reveal the panel, lock the page scroll,
   then add `.is-open` on the next frame so the transition actually plays.
   ========================================================================== */
(function () {
  'use strict';

  const menu = query('aside .menu');
  const sideBottom = query('aside .side-b');
  const brand = query('aside .brand');
  if (!menu) return;

  const desktopQuery = matchMedia('(min-width: 901px)');

  /* ---- Build the markup --------------------------------------------- */

  // The drawer mirrors the desktop nav, keeping the same order and labels.
  const links = queryAll('a', menu)
    .map((link) => `<a href="${link.getAttribute('href')}" data-c>${(link.textContent || '').trim()}</a>`)
    .join('');

  const homeHref = (brand && brand.getAttribute('href')) || '/';
  const brandEl = brand && brand.querySelector('b');
  const brandName = brandEl ? brandEl.textContent : '';

  // The sound and theme controls are MOVED, never cloned, so there is only ever
  // one #mu / .term-open in the document and the existing wiring in main.js and
  // terminal.js keeps working no matter where the element currently sits.
  const controls = sideBottom ? query('.side-r', sideBottom) : null;
  const terminalOpener = sideBottom ? query('.term-open', sideBottom) : null;

  const brandLink = `<a class="brand" href="${homeHref}" data-c aria-label="Home"><b>${brandName}</b></a>`;

  const bar = document.createElement('div');
  bar.className = 'mbar';
  bar.innerHTML = `
    <div class="mbar-bar">
      ${brandLink}
      <button class="icon-button mnav-icon" type="button" id="mnav-open"
        aria-expanded="false" aria-controls="mnav" aria-label="Open menu" title="Open menu">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>`;

  const drawer = document.createElement('div');
  drawer.id = 'mnav';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Menu');
  drawer.innerHTML = `
    <div class="mbar-bar">
      ${brandLink}
      <button class="icon-button mnav-icon" type="button" id="mnav-close"
        aria-label="Close menu" title="Close menu">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>
      </button>
    </div>
    <div class="mnav-body">
      <nav class="mnav-list mnav-group" style="transition-delay: 0.05s" aria-label="Primary">${links}</nav>
      <div class="mnav-foot mnav-group" style="transition-delay: 0.15s"></div>
    </div>`;

  document.body.append(bar, drawer);

  const foot = query('.mnav-foot', drawer);
  const openButton = query('#mnav-open', bar);
  const closeButton = query('#mnav-close', drawer);
  const openLinks = queryAll('.mnav-list a', drawer);

  /* ---- Place the shared controls -------------------------------------- */
  /* The terminal opener and the theme/sound controls must live in the drawer on
     phones and back in the sidebar on desktop, so they are moved between the
     two homes as the breakpoint changes. Moving (rather than cloning) keeps a
     single #mu and a single .term-open, so the wiring in main.js and
     terminal.js — both of which grabbed those elements at load — stays valid. */

  function placeControls() {
    if (!sideBottom) return;

    const home = desktopQuery.matches ? sideBottom : foot;

    if (terminalOpener && terminalOpener.parentElement !== home) home.append(terminalOpener);
    if (controls && controls.parentElement !== home) home.append(controls);
  }

  placeControls();

  /* ---- Open / close -------------------------------------------------- */

  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    document.documentElement.style.overflow = 'hidden';
    // The panel is always in the DOM, so flip the class on the next frame —
    // otherwise the browser coalesces both and the fade is skipped.
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    openButton.setAttribute('aria-expanded', 'false');
    openButton.focus();
  }

  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);

  // Following a link should never leave the drawer latched open behind the new
  // page — bfcache can restore the document without re-running this script.
  openLinks.forEach((link) => link.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    // The drawer is a modal dialog, so Tab is kept inside it. The drawer holds
    // only known controls, and `visibility: hidden` already removes it from the
    // tab order while closed, so no visibility filtering is needed here.
    if (event.key !== 'Tab') return;

    const focusable = queryAll('a[href], button:not([disabled])', drawer);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Crossing the breakpoint in either direction moves the shared controls to
  // whichever surface is now visible. Growing past it also reveals the real
  // sidebar, so the drawer must not stay latched open behind that.
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches && isOpen) close();
    placeControls();
  });
})();

/* ==========================================================================
   INIT
   ========================================================================== */
syncTheme();

// Pins the vertical guide to the top of the first content section, so it never
// runs through the hero. On inner pages the first section starts at the top.
function alignSectionGuide() {
  const guide = query('.v2');
  const firstSection = query('main .sec');
  if (guide && firstSection) guide.style.top = `${firstSection.offsetTop}px`;
}

[graph, spy, fit, alignSectionGuide].forEach((initStep) => {
  try {
    initStep();
  } catch (error) {
    console.error(initStep.name, error);
  }
});

addEventListener('resize', fit);
addEventListener('resize', alignSectionGuide);
document.fonts?.ready.then(alignSectionGuide);
