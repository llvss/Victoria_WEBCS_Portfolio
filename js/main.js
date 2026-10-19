const query = (selector, root = document) => root.querySelector(selector);
const queryAll = (selector, root = document) => [...root.querySelectorAll(selector)];
const GITHUB_USER = 'llvss';

const THEME_STORAGE_KEY = 'lv-theme';
const MUTED_STORAGE_KEY = 'lv-muted';
const CLICK_SFX_SRC = '/public/sfx/button-click.mp3';
const CLICK_SFX_VOL = 0.3;
const CLICK_SFX_GAP = 40;
const HOVER_SFX_SRC = '/public/sfx/button-hover.mp3';
const HOVER_SFX_VOL = 0.35;
const HOVER_SFX_GAP = 60;

const CLICKABLE_SELECTOR = 'button,[data-c],.bx,.af,.so';
const HOVER_SFX_SELECTOR = CLICKABLE_SELECTOR;

function renderGraph(contributions, total, publicRepos) {
  const graphGrid = query('#gc');
  if (!graphGrid) return;

  const WEEKS = 53;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const byDate = new Map(contributions.map((day) => [day.date, day]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const tip = query('#tip');
  if (!tip) return;

  const hideTip = () => { tip.style.display = 'none'; };
  const showTip = (event) => {
    const cell = event.target.closest('.c');
    if (!cell || !cell.dataset.d) {
      hideTip();
      return;
    }
    tip.textContent = `${cell.dataset.n} contributions · ${cell.dataset.d}`;
    tip.style.display = 'block';

    const margin = 12;
    const gap = 12;
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const left = Math.max(margin, Math.min(
      event.clientX - width / 2, viewportWidth - width - margin
    ));
    let top = event.clientY - height - gap;
    if (top < margin) top = event.clientY + gap;
    top = Math.max(margin, Math.min(top, viewportHeight - height - margin));
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  };

  graphGrid.addEventListener('pointerover', showTip);
  graphGrid.addEventListener('pointermove', showTip);
  graphGrid.addEventListener('pointerleave', hideTip);
  addEventListener('scroll', hideTip, { passive: true });
  addEventListener('resize', hideTip);
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

const BAYER_THRESHOLDS = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
  (value) => (value + 0.5) / 16
);

let gridWidth = 0;
let gridHeight = 0;
let angle = 0.42;
const PIXEL_SIZE = 5;
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

document.documentElement.addEventListener('transitionend', (event) => {
  if (event.target === document.documentElement && event.propertyName === '--ink') draw();
});

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

const ICON_ATTRS = { class: 'ic', 'stroke-width': 1.5, 'aria-hidden': 'true', focusable: 'false' };
lucide.createIcons({ attrs: ICON_ATTRS });

const ICON = (name) => {
  const iconName = name.replace(/(^|-)(\w)/g, (_, separator, letter) => letter.toUpperCase());
  const icon = lucide.createElement(lucide.icons[iconName]);
  Object.entries(ICON_ATTRS).forEach(([attribute, value]) => icon.setAttribute(attribute, value));
  return icon.outerHTML;
};

const THEME_ICONS = {
  soundOn: ICON('volume-2'),
  soundOff: ICON('volume-x'),
  system: ICON('monitor'),
  light: ICON('sun'),
  dark: ICON('moon'),
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
  syncTheme();
}

function resolveTheme() {
  return theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
}

function syncTheme() {
  const resolvedTheme = resolveTheme();

  document.documentElement.dataset.t = resolvedTheme;

  const source = `/public/img/logo-${resolvedTheme}.png`;
  queryAll('.logo, .loader-logo').forEach((logo) => {
    if (logo.getAttribute('src') !== source) logo.setAttribute('src', source);
  });

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

function dismissPageLoader() {
  const loader = query('#page-loader');
  if (!loader) return;

  setTimeout(() => loader.classList.add('is-leaving'), 650);
}

if (document.readyState === 'complete') dismissPageLoader();
else addEventListener('load', dismissPageLoader, { once: true });

systemTheme.addEventListener('change', () => {
  if (theme === 'system') syncTheme();
});

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
  document.addEventListener(
    'pointerover',
    (event) => {
      if (event.pointerType === 'touch') return;
      const element = event.target.closest(HOVER_SFX_SELECTOR);
      if (!element) return;
      if (element.contains(event.relatedTarget)) return;
      playHoverSound();
    },
    { passive: true }
  );

  document.addEventListener('focusin', (event) => {
    const element = event.target.closest(HOVER_SFX_SELECTOR);
    if (element && element.matches(':focus-visible')) playHoverSound();
  });

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

(function () {
  if (!finePointer) return;

  const glow = query('#glow');
  const lens = query('#lens');
  const nameElement = query('.name');
  if (!glow || !lens || !nameElement) return;

  const LENS_RADIUS = 95;
  const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;

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

(function () {
  'use strict';

  const menu = query('aside .menu');
  const sideBottom = query('aside .side-b');
  const brand = query('aside .brand');
  if (!menu) return;

  const desktopQuery = matchMedia('(min-width: 901px)');


  const links = queryAll('a', menu)
    .map((link) => {
      const icon = query('.ic', link);
      const label = (link.textContent || '').trim();
      return `<a href="${link.getAttribute('href')}" data-c>${icon ? icon.outerHTML : ''}<span>${label}</span></a>`;
    })
    .join('');

  const homeHref = (brand && brand.getAttribute('href')) || '/';
  const brandEl = brand && brand.querySelector('b');
  const brandName = brandEl ? brandEl.textContent : '';

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
        ${ICON('menu')}
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
        ${ICON('x')}
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


  function placeControls() {
    if (!sideBottom) return;

    const controlHome = desktopQuery.matches ? sideBottom : foot;

    if (terminalOpener && terminalOpener.parentElement !== sideBottom) sideBottom.append(terminalOpener);
    if (controls && controls.parentElement !== controlHome) controlHome.append(controls);
    const iconButton = query('.term-open-icon');
    if (iconButton && iconButton.parentElement !== sideBottom) sideBottom.append(iconButton);
  }

  placeControls();


  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    document.documentElement.style.overflow = 'hidden';
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

  openLinks.forEach((link) => link.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

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

  desktopQuery.addEventListener('change', (event) => {
    if (event.matches && isOpen) close();
    placeControls();
  });
})();

function revealHero() {
  const desc = query('.desc');
  const hero = query('#home');
  if (!desc || !hero) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const walker = document.createTreeWalker(desc, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) textNodes.push(node);

  const words = [];
  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = part;
      fragment.appendChild(span);
      words.push(span);
    });
    node.replaceWith(fragment);
  });

  if (!words.length) return;

  const total = words.length;

  if (reduceMotion) {
    words.forEach((word) => word.style.setProperty('--w', '1'));
    return;
  }

  const clamp01 = (value) => Math.min(1, Math.max(0, value));

  const track = document.createElement('div');
  track.className = 'hero-reveal';
  hero.before(track);
  track.appendChild(hero);

  let distance = 1;
  let frame = 0;
  const paint = () => {
    frame = 0;
    const progress = clamp01(-track.getBoundingClientRect().top / distance);
    const reach = progress * (total + 0.5);
    words.forEach((word, index) => {
      word.style.setProperty('--w', clamp01((reach - index) / 1.5).toFixed(3));
    });
  };

  const schedulePaint = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  const measure = () => {
    distance = Math.max(1, hero.offsetHeight);
    track.style.height = (hero.offsetHeight + distance) + 'px';
    alignSectionGuide();
    schedulePaint();
  };

  addEventListener('scroll', schedulePaint, { passive: true });
  addEventListener('resize', measure, { passive: true });
  document.fonts?.ready.then(measure);
  measure();
}

function initProjectPreviews() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');

  queryAll('.project-thumbnail[data-preview]').forEach((image) => {
    const card = image.closest('.project-card');
    const media = image.closest('.project-media');
    let thumbnail = image.getAttribute('src');
    let hovered = false;
    let focused = false;
    let playing = false;
    let generation = 0;
    let gifData = null;
    let currentPreview = null;

    const retirePreview = () => {
      const preview = currentPreview;
      currentPreview = null;
      if (!preview) return;
      const visible = preview.classList.contains('is-visible');
      preview.classList.remove('is-visible');
      const cleanup = () => {
        preview.remove();
        URL.revokeObjectURL(preview.src);
      };
      if (visible) setTimeout(cleanup, 400);
      else cleanup();
    };

    const update = (restart = false) => {
      const active = !reducedMotion.matches && (hovered || focused);
      if (active && playing && !restart) return;
      playing = active;
      const request = ++generation;
      retirePreview();
      if (!active) return;

      if (!gifData) {
        gifData = fetch(image.dataset.preview)
          .then((response) => {
            if (!response.ok) throw new Error('Project preview unavailable');
            return response.blob();
          })
          .catch((error) => { gifData = null; throw error; });
      }
      gifData.then((blob) => {
        if (request !== generation || !playing) return;
        const preview = new Image(1920, 1080);
        preview.className = 'project-preview';
        preview.alt = '';
        preview.setAttribute('aria-hidden', 'true');
        currentPreview = preview;
        preview.onload = () => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (request === generation && playing) preview.classList.add('is-visible');
          }));
        };
        preview.onerror = () => {
          if (request !== generation) return;
          playing = false;
          retirePreview();
        };
        media.appendChild(preview);
        preview.src = URL.createObjectURL(blob);
      }).catch(() => {
        if (request === generation) playing = false;
      });
    };

    const fallback = () => {
      if (image.getAttribute('src') !== thumbnail) return;
      thumbnail = '/public/img/projects/placeholder.svg';
      image.alt = card.querySelector('h3').textContent + ' — thumbnail coming soon';
      if (image.getAttribute('src') !== thumbnail) image.src = thumbnail;
    };
    image.addEventListener('error', fallback);
    if (image.complete && !image.naturalWidth) fallback();

    card.addEventListener('pointerenter', (event) => {
      hovered = event.pointerType !== 'touch' && hoverPointer.matches;
      update(hovered);
    });
    card.addEventListener('pointerleave', () => { hovered = false; update(); });
    card.addEventListener('focusin', (event) => {
      focused = event.target.matches(':focus-visible');
      update();
    });
    card.addEventListener('focusout', (event) => {
      if (!card.contains(event.relatedTarget)) { focused = false; update(); }
    });
    reducedMotion.addEventListener('change', () => update());
    hoverPointer.addEventListener('change', () => { hovered = false; update(); });
  });
}

syncTheme();

function alignSectionGuide() {
  const guide = query('.v2');
  const firstSection = query('main .sec');
  if (guide && firstSection) guide.style.top = `${firstSection.offsetTop}px`;
}

[initProjectPreviews, graph, spy, fit, alignSectionGuide, revealHero].forEach((initStep) => {
  try {
    initStep();
  } catch (error) {
    console.error(initStep.name, error);
  }
});

addEventListener('resize', fit);
addEventListener('resize', alignSectionGuide);
document.fonts?.ready.then(alignSectionGuide);
