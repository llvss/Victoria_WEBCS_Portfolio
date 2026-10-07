/* ==========================================================================
   TERMINAL
   --------------------------------------------------------------------------
   A macOS-flavoured terminal overlay. The sidebar carries a small text link
   that opens a draggable window wired to a fake filesystem mirroring the site's
   pages, so `ls`, `cd` and `cat` actually do something. Ctrl + ` also works.
   ========================================================================== */
(function () {
  'use strict';

  const launchButton = query('.term-open');
  const terminal = query('#term');
  if (!launchButton || !terminal) return;

  const screen = query('#term-screen');
  const form = query('#term-form');
  const input = query('#term-input');
  const promptLabel = query('#term-prompt');
  const titleBar = query('#term-bar');
  const titleLabel = query('#term-title');
  const termWindow = query('#term .term-window');
  if (!termWindow) return;

  const clearButton = query('[data-term="clear"]');
  const closeButton = query('[data-term="close"]');
  const zoomButton = query('[data-term="zoom"]');
  const [minimiseButton] = queryAll('[data-term="minimise"]');

  /* ---------------------------------------------------------------------
     Fake filesystem: one directory per page, with a few readable files.
     --------------------------------------------------------------------- */
  const DIRECTORIES = {
    '~': {
      page: 'index.html',
      entries: [
        'about.txt',
        'contact.txt',
        'projects/',
        'experience/',
        'affiliations/',
        'activity/',
        'recommendations/',
        'socials/',
        'gear/',
      ],
    },
    '~/projects': {
      page: 'projects.html',
      entries: [
        '01-project-one.md',
        '02-project-two.md',
        '03-project-three.md',
        '04-project-four.md',
        '05-project-five.md',
        '06-project-six.md',
        '07-project-seven.md',
        '08-project-eight.md',
        '09-project-nine.md',
        '10-project-ten.md',
      ],
    },
    '~/affiliations': {
      page: 'affiliations.html',
      entries: ['web-dev-committee.txt', 'it-student-society.txt', 'hackathon-community.txt'],
    },
    '~/recommendations': {
      page: 'recommendations.html',
      entries: ['alex-rivera.txt', 'jamie-cruz.txt', 'sam-patel.txt'],
    },
    '~/gear': {
      page: 'gear.html',
      entries: ['rig.txt', 'tools.txt', 'specs.txt'],
    },
  };

  const EXTERNAL_LINKS = {
    github: 'https://github.com/llvss',
    linkedin: 'https://www.linkedin.com/',
    instagram: 'https://www.instagram.com/',
    email: 'mailto:lovenponce@gmail.com',
  };

  // Files are keyed by their full path so `cat` can find them from any directory.
  const FILES = {
    '~/about.txt': [
      'Loven Victoria',
      'Fullstack developer & IT student, Mabalacat Pampanga, PH.',
      '',
      'Second-year Computer Science student at Holy Angel University.',
      'I build web applications, ship side projects and contribute to',
      'open source. Currently open to freelance and internships.',
    ],
    '~/contact.txt': [
      'email   lovenponce@gmail.com',
      'github  github.com/llvss',
      '',
      'The fastest way to reach me is email — I answer within a day.',
    ],
    '~/projects/01-project-one.md': [
      '# Project One (2025)',
      '',
      'Full-stack web app with a REST API, authentication and a',
      'responsive admin dashboard.',
      '',
      'stack: React · Node.js · PostgreSQL',
    ],
    '~/projects/02-project-two.md': [
      '# Project Two (2025)',
      '',
      'UI/UX case study: user research, wireframes and a tested',
      'interactive prototype.',
      '',
      'stack: Figma · UX Research',
    ],
    '~/projects/03-project-three.md': [
      '# Project Three (2024)',
      '',
      'Algorithms and data-structure toolkit for a programming',
      'course, fully unit tested.',
      '',
      'stack: TypeScript · Vitest',
    ],
    '~/projects/04-project-four.md': [
      '# Project Four (2024)',
      '',
      'Hackathon build: a working demo shipped in a single weekend',
      'with a small team.',
      '',
      'stack: Hackathon · API',
    ],
    '~/projects/05-project-five.md': [
      '# Project Five (2025)',
      '',
      'Marketing site and CMS for a small business, with a component',
      'library and dark mode.',
      '',
      'stack: Next.js · Tailwind',
    ],
    '~/projects/06-project-six.md': [
      '# Project Six (2024)',
      '',
      'REST microservice that ingests sensor data, validates it and',
      'streams aggregates onward.',
      '',
      'stack: Python · FastAPI · Docker',
    ],
    '~/projects/07-project-seven.md': [
      '# Project Seven (2023)',
      '',
      'Realtime chat client with presence, typing indicators and',
      'offline message queuing.',
      '',
      'stack: Vue · Firebase',
    ],
    '~/projects/08-project-eight.md': [
      '# Project Eight (2023)',
      '',
      'Booking system with availability rules, payment handling and',
      'an admin back office.',
      '',
      'stack: Express · Prisma',
    ],
    '~/projects/09-project-nine.md': [
      '# Project Nine (2022)',
      '',
      'Coursework build: a library management API with role-based',
      'access control and tests.',
      '',
      'stack: Java · Spring Boot',
    ],
    '~/projects/10-project-ten.md': [
      '# Project Ten (2022)',
      '',
      'Design system: 60+ accessible components, documented tokens',
      'and a style guide.',
      '',
      'stack: Figma · Storybook',
    ],
    '~/experience/roles.txt': [
      '2026 — Now    Fullstack Developer (Intern) · Tech Company, Manila',
      '2025 — 2026   Web Development Lead · University Org, Manila',
      '2024 — 2025   Frontend Developer (Part-time) · Freelance / Remote',
    ],
    '~/experience/resume.pdf': [
      'resume.pdf is not bundled with the site — email',
      'lovenponce@gmail.com to request a copy.',
    ],
    '~/affiliations/web-dev-committee.txt': [
      'Organization One — Web Development Committee (2025 — Now)',
      'Builds and maintains internal web tools, reviews pull requests',
      'and runs onboarding sessions.',
    ],
    '~/affiliations/it-student-society.txt': [
      'Organization Two — IT Student Society (2024 — Now)',
      'Helps organise tech talks, study groups and the annual campus',
      'coding challenge.',
    ],
    '~/affiliations/hackathon-community.txt': [
      'Organization Three — Hackathon Community (2025)',
      'Teams up for weekend builds, ships prototypes and demos',
      'under time pressure.',
    ],
    '~/activity/contributions.log': [
      'Contribution history is rendered live on the Activity page',
      'from the public GitHub API: 53 weeks of commits, streaks',
      'and repo counts, straight from the source.',
    ],
    '~/activity/stacks.txt': [
      'Frontend  TypeScript · React · Next.js · CSS · Tailwind',
      'Backend   Node.js · Express · PostgreSQL · Prisma · PHP',
      'Tooling   Git · Vite · Vitest · Docker · CI/CD',
      'Practices Agile · Code Review · Testing · Accessibility',
    ],
    '~/recommendations/alex-rivera.txt': [
      'Alex Rivera — Engineering Manager, Tech Company',
      '',
      '"Reliable end to end. Takes a vague requirement and turns it',
      'into something shipped, tested and easy for the rest of the',
      'team to maintain."',
    ],
    '~/recommendations/jamie-cruz.txt': [
      'Jamie Cruz — Team Lead, University Org',
      '',
      '"The person everyone asks when a project needs rescuing. Calm',
      'under deadline pressure and genuinely good at breaking work',
      'down."',
    ],
    '~/recommendations/sam-patel.txt': [
      'Sam Patel — Product Designer, Freelance',
      '',
      '"Understands design intent properly and pushes back with better',
      'ideas. Our cleanest handover of any collaborator so far."',
    ],
    '~/socials/links.txt': [
      'github    https://github.com/llvss',
      'linkedin  https://www.linkedin.com/',
      'instagram https://www.instagram.com/',
      'email     lovenponce@gmail.com',
    ],
    '~/gear/rig.txt': [
      'laptop    MacBook Pro 14" · Apple M3 Pro · 36 GB',
      'display   LG UltraFine 27" · 3840 x 2160',
      'keyboard  Keychron K2 · Gateron Brown',
      'mouse     Logitech MX Master',
    ],
    '~/gear/tools.txt': [
      'editor    VS Code · TypeScript, Python',
      'shell     zsh + Starship',
      'runtime   Node 22',
      'design    Figma · CSS custom properties',
    ],
    '~/gear/specs.txt': [
      'frontend  React, Next.js',
      'backend   Node, Express',
      'database  PostgreSQL',
      'workflow  Git + GitHub · Vercel · GitHub Actions',
      'this site hand-written HTML, CSS and JS · no dependencies',
    ],
  };

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  let cwd = '~';
  const history = [];
  let historyIndex = 0;
  let zoomed = false;

  // "index.html" for both "/" and "/index.html", so the site behaves the same
  // when opened from a server or straight off the filesystem.
  function currentPageFile() {
    const lastSegment = location.pathname.split('/').filter(Boolean).pop();
    return (lastSegment || 'index.html').toLowerCase();
  }

  /* ---------------------------------------------------------------------
     Output helpers
     --------------------------------------------------------------------- */
  function write(text, variant) {
    const line = document.createElement('div');
    line.className = variant ? 'term-line ' + variant : 'term-line';
    // A non-breaking space keeps blank lines from collapsing to zero height.
    line.textContent = text === '' ? ' ' : text;
    screen.appendChild(line);
  }

  function writeBlock(lines, variant) {
    lines.forEach((line) => write(line, variant));
  }

  function scrollToEnd() {
    screen.scrollTop = screen.scrollHeight;
  }

  // Echo the command back with its prompt so the transcript reads like a real
  // session rather than a log dump.
  function echo(command) {
    const line = document.createElement('div');
    line.className = 'term-line term-echo';

    const user = document.createElement('span');
    user.className = 'term-user';
    user.textContent = `loven@loven ${cwd} %`;

    const body = document.createElement('span');
    body.className = 'term-cmd';
    body.textContent = command;

    line.append(user, body);
    screen.appendChild(line);
  }

  // The prompt, the window title and the echoed commands all show the working
  // directory, so they are all kept in step here.
  function syncPrompt() {
    const prompt = `loven@loven ${cwd} %`;
    promptLabel.textContent = prompt;
    if (titleLabel) titleLabel.textContent = `loven@loven: ${cwd} — lvsh`;
  }

  function clearScreen() {
    screen.textContent = '';
  }

  /* ---------------------------------------------------------------------
     Path resolution
     --------------------------------------------------------------------- */
  // Resolves user input against the current directory into a known directory
  // or file key, or null when nothing matches.
  function resolve(target) {
    if (!target) return null;

    let path = target.trim().replace(/\/+$/, '');

    if (path === '~' || path === '/') return '~';
    if (path === '.') return cwd;
    if (path === '..') return '~';

    if (path.startsWith('~/')) path = path.slice(1);
    else if (path.startsWith('/')) path = '~' + path;
    else if (!path.startsWith('~')) path = cwd + '/' + path;

    // Walk the segments so `..` is handled the way it reads.
    const stack = [];
    for (const segment of path.split('/').filter(Boolean)) {
      if (segment === '~') stack.length = 0;
      else if (segment === '..') stack.pop();
      else stack.push(segment);
    }

    const normalised = '~' + (stack.length ? '/' + stack.join('/') : '');
    return DIRECTORIES[normalised] || FILES[normalised] ? normalised : null;
  }

  /* ---------------------------------------------------------------------
     Commands
     --------------------------------------------------------------------- */
  const COMMANDS = {
    ls(args) {
      const target = args[0] ? resolve(args[0]) : cwd;
      if (!target) {
        write(`ls: no such file or directory: ${args[0]}`, 'term-error');
        return;
      }
      if (FILES[target]) {
        write(target.split('/').pop());
        return;
      }
      write(`Directory of ${target}`, 'term-dim');
      write('');
      DIRECTORIES[target].entries.forEach((entry) => {
        write('  ' + entry, entry.endsWith('/') ? 'term-dir' : 'term-file');
      });
    },

    cd(args) {
      const target = resolve(args[0] || '~');
      if (!target) {
        write(`cd: no such file or directory: ${args[0]}`, 'term-error');
        return;
      }
      if (FILES[target]) {
        write(`cd: not a directory: ${args[0]}`, 'term-error');
        return;
      }
      cwd = target;
      syncPrompt();
    },

    pwd() {
      write(cwd);
    },

    cat(args) {
      if (!args[0]) {
        write('cat: missing operand — try "cat about.txt"', 'term-error');
        return;
      }
      const target = resolve(args[0]);
      if (!target) {
        write(`cat: no such file or directory: ${args[0]}`, 'term-error');
        return;
      }
      if (!FILES[target]) {
        write(`cat: ${args[0]}: Is a directory`, 'term-error');
        return;
      }
      writeBlock(FILES[target]);
    },

    open(args) {
      if (!args[0]) {
        write('open: missing operand — try "open projects" or "open github"', 'term-error');
        return;
      }
      const name = args[0].toLowerCase();

      if (EXTERNAL_LINKS[name]) {
        write(`Opening ${args[0]} in a new tab…`, 'term-dim');
        window.open(EXTERNAL_LINKS[name], '_blank', 'noopener');
        return;
      }

      const target = resolve(args[0]);
      if (!target) {
        write(`open: no such file or directory: ${args[0]}`, 'term-error');
        return;
      }
      const page = DIRECTORIES[target].page;
      write(`Opening ${page}…`, 'term-dim');
      location.href = page;
    },

    pages() {
      write('Site pages', 'term-strong');
      write('');
      Object.keys(DIRECTORIES).forEach((key) => {
        const directory = DIRECTORIES[key];
        const marker = directory.page === currentPageFile() ? '*' : ' ';
        write(`  ${marker} ${directory.page.padEnd(24)} ${key}`);
      });
      write('');
      write('  * = current page', 'term-dim');
    },

    whoami() {
      write('loven victoria — fullstack developer & it student');
      write('second-year computer science, holy angel university');
      write('based in mabalacat, pampanga, ph · utc+8');
    },

    about() {
      COMMANDS.cat(['about.txt']);
    },

    contact() {
      COMMANDS.cat(['contact.txt']);
    },

    skills() {
      COMMANDS.cat(['~/activity/stacks.txt']);
    },

    neofetch() {
      const uptime = Math.round((Date.now() - performance.timeOrigin) / 1000);
      const theme = document.documentElement.dataset.t || 'dark';
      // Neofetch prints hex swatches, so convert the computed rgb() values.
      const hex = (variable) => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(variable)
          .trim();
        const probe = document.createElement('div');
        probe.style.color = value;
        document.body.appendChild(probe);
        const rgb = getComputedStyle(probe).color.match(/\d+/g) || [];
        probe.remove();
        return (
          '#' +
          rgb
            .slice(0, 3)
            .map((n) => Number(n).toString(16).padStart(2, '0'))
            .join('')
        );
      };
      const ink = hex('--ink');
      const blue = hex('--blue');

      writeBlock(
        [
          '        ▄▄▄▄▄▄▄▄▄▄        ' + 'loven@loven',
          '     ▄██████████████▄     ' + '----------------',
          '    ████  ▄▄▄▄▄  ████    ' + 'OS: Web · ' + navigator.platform,
          '    ████  █   █  ████    ' + 'Shell: lvsh 1.0',
          '     ▀██████████████▀     ' + 'Theme: ' + theme,
          '        ▀▀▀▀▀▀▀▀▀▀        ' + 'Uptime: ' + uptime + 's',
        ],
        'term-accent'
      );
      write('');
      write('  Host: lovenvictoria.dev');
      write('  Pages: ' + Object.keys(DIRECTORIES).length);
      write('  Stack: TypeScript · React · Node.js · PostgreSQL');
      write('  Role:  Fullstack developer & IT student');
      write('');
      write('  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄', 'term-dim');
      write('  [' + ink + ']   [' + blue + ']   [', 'term-dim');
      write('');
      write('  type "help" for the command list', 'term-dim');
    },

    theme(args) {
      const requested = (args[0] || '').toLowerCase();
      if (!requested) {
        write('current theme: ' + (document.documentElement.dataset.t || 'unknown'));
        write('usage: theme system | light | dark');
        return;
      }
      const button = query(`.theme-option[data-theme="${requested}"]`);
      if (!button) {
        write(`theme: unknown theme "${requested}" — try system, light or dark`, 'term-error');
        return;
      }
      button.click();
      write('theme preference set to ' + requested, 'term-dim');
    },

    sound(args) {
      const toggle = query('#mu');
      if (!toggle) return;

      const requested = (args[0] || '').toLowerCase();
      const isMuted = toggle.getAttribute('aria-pressed') === 'true';

      if (requested === 'on' || requested === 'off') {
        if ((requested === 'off') === isMuted) {
          write('sound is already ' + requested, 'term-dim');
          return;
        }
        toggle.click();
        write('sound ' + requested, 'term-dim');
        return;
      }

      toggle.click();
      write('sound ' + (isMuted ? 'on' : 'off'), 'term-dim');
    },

    history() {
      if (!history.length) {
        write('no history yet', 'term-dim');
        return;
      }
      history.forEach((command, index) => {
        write(`  ${String(index + 1).padStart(3)}  ${command}`);
      });
    },

    date() {
      write(new Date().toString());
    },

    echo(args, raw) {
      write(raw.replace(/^echo\s*/i, ''));
    },

    whois() {
      COMMANDS.contact();
    },

    clear() {
      clearScreen();
    },

    exit() {
      close();
      write('session closed — reopen with the >_ button', 'term-dim');
    },

    sudo(args) {
      if (!args[0]) {
        write('usage: sudo <command>', 'term-error');
        return;
      }
      write('loven is not in the sudoers file. This incident will be reported.', 'term-error');
      write('(it will not be reported)', 'term-dim');
    },

    man(args) {
      if (!args[0]) {
        write('What manual page do you want?', 'term-error');
        return;
      }
      if (!COMMANDS[args[0].toLowerCase()]) {
        write(`No manual entry for ${args[0]}`, 'term-error');
        return;
      }
      write(args[0].toUpperCase() + '(1)', 'term-strong');
      write('');
      write('  Part of the lvsh suite. Run "help" for the command list,');
      write('  or "cat about.txt" to read about the person behind it.');
    },

    help() {
      write('lvsh 1.0 — available commands', 'term-strong');
      write('');
      write('  Navigation');
      write('    ls [path]       list files in a directory');
      write('    cd <path>       change directory   (cd .. goes back)');
      write('    pwd             print working directory');
      write('    cat <file>      print a file');
      write('    open <path>     open a page        (open projects)');
      write('    pages           list every page');
      write('');
      write('  About');
      write('    whoami          who you are talking to');
      write('    about           short introduction');
      write('    contact         email and socials');
      write('    skills          tech stacks');
      write('    neofetch        system summary');
      write('');
      write('  Interface');
      write('    theme [name]    system | light | dark');
      write('    sound [on|off]  toggle interface sounds');
      write('');
      write('  Shell');
      write('    history         recently run commands');
      write('    date            current date and time');
      write('    echo <text>     repeat text back');
      write('    man <command>   help on one command');
      write('    clear           clear the screen');
      write('    exit            close the terminal');
      write('');
      write('  Tab completes · ↑ ↓ walks history · Ctrl + ` toggles', 'term-dim');
    },

  };

  /* ---------------------------------------------------------------------
     Dispatch
     --------------------------------------------------------------------- */
  function run(raw) {
    const command = raw.trim();
    if (!command) return;

    echo(command);

    if (history[history.length - 1] !== command) history.push(command);
    historyIndex = history.length;

    const parts = command.split(/\s+/);
    const name = parts[0].toLowerCase();
    const handler = COMMANDS[name];

    if (!handler) {
      write(`lvsh: command not found: ${name}`, 'term-error');
      write('type "help" to see what is available', 'term-dim');
      scrollToEnd();
      return;
    }

    try {
      handler(parts.slice(1), command);
    } catch (error) {
      write(`${name}: ${error.message}`, 'term-error');
    }
    scrollToEnd();
  }

  // Tab-completion across command names, then the current directory's entries.
  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    const isFirstToken = parts.length === 1;
    const fragment = isFirstToken ? parts[0] : parts[parts.length - 1];

    const pool = isFirstToken
      ? Object.keys(COMMANDS)
      : (DIRECTORIES[cwd] && DIRECTORIES[cwd].entries) || [];

    const matches = pool.filter((entry) => entry.startsWith(fragment));

    if (matches.length === 1) {
      const match = matches[0];
      input.value = isFirstToken
        ? match + ' '
        : value.slice(0, value.length - fragment.length) + match;
      return;
    }

    if (matches.length > 1) {
      echo(value);
      write('  ' + matches.join('   '), 'term-dim');
      scrollToEnd();
    }
  }

  /* ---------------------------------------------------------------------
     Open / close
     --------------------------------------------------------------------- */
  function open() {
    terminal.hidden = false;
    // Force a reflow so the opening transition always plays.
    void terminal.offsetWidth;
    terminal.classList.add('is-open');
    launchButton.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function close() {
    terminal.classList.remove('is-open');
    terminal.hidden = true;
    launchButton.setAttribute('aria-expanded', 'false');
  }

  function greet() {
    clearScreen();
    write('Last login: ' + new Date().toLocaleString(), 'term-dim');
    write('');
    write('Welcome to lvsh 1.0 — the Loven Victoria shell.', 'term-accent');
    write('');
    write('  A real terminal, wired to the portfolio filesystem.');
    write('  Try "ls", "cat about.txt", "pages" or "neofetch".', 'term-dim');
    write('  Type "help" for the full command list.', 'term-dim');
    write('  Press Ctrl + ` or Escape to close.', 'term-dim');
    write('');
    scrollToEnd();
  }

  /* ---------------------------------------------------------------------
     Wiring
     --------------------------------------------------------------------- */
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    run(value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      complete();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || '';
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
      return;
    }

    // Ctrl + L clears the screen, like a real terminal.
    if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      clearScreen();
    }
  });

  launchButton.addEventListener('click', () => {
    if (terminal.hidden) open();
    else close();
  });

  closeButton?.addEventListener('click', close);

  clearButton?.addEventListener('click', () => {
    clearScreen();
    input.focus();
  });

  // Clicking the scrim (the overlay behind the window) dismisses it.
  terminal.addEventListener('pointerdown', (event) => {
    if (event.target === terminal) close();
  });

  // The yellow button tucks the window away, then it springs back.
  minimiseButton?.addEventListener('click', () => {
    terminal.classList.add('is-minimised');
    input.blur();
  });

  terminal.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform' && terminal.classList.contains('is-minimised')) {
      terminal.classList.remove('is-minimised');
    }
  });

  zoomButton?.addEventListener('click', () => {
    zoomed = !zoomed;
    terminal.classList.toggle('is-zoomed', zoomed);
    // Reset any drag offset so the zoomed window fills the scrim cleanly.
    if (zoomed) {
      termWindow.style.left = '';
      termWindow.style.top = '';
    }
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.title = zoomed ? 'Restore' : 'Zoom';
  });

  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + ` toggles the terminal, the way a real one is summoned.
    if ((event.ctrlKey || event.metaKey) && event.key === '`') {
      event.preventDefault();
      if (terminal.hidden) open();
      else close();
      return;
    }

    if (event.key === 'Escape' && !terminal.hidden) close();
  });

  /* ---------------------------------------------------------------------
     Dragging
     --------------------------------------------------------------------- */
  let dragging = null;

  titleBar.addEventListener('pointerdown', (event) => {
    if (zoomed || event.target.closest('button')) return;

    const bounds = termWindow.getBoundingClientRect();
    dragging = { offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top };
    titleBar.setPointerCapture(event.pointerId);
    terminal.classList.add('is-dragging');
  });

  titleBar.addEventListener('pointermove', (event) => {
    if (!dragging) return;

    const width = termWindow.offsetWidth;
    // Clamped so the window can never be dragged out of reach.
    const left = Math.min(Math.max(event.clientX - dragging.offsetX, -width + 90), innerWidth - 90);
    const top = Math.min(Math.max(event.clientY - dragging.offsetY, 0), innerHeight - 44);

    // The scrim stays pinned full-screen; only the panel is repositioned.
    termWindow.style.position = 'fixed';
    termWindow.style.left = left + 'px';
    termWindow.style.top = top + 'px';
    termWindow.style.margin = '0';
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = null;
    terminal.classList.remove('is-dragging');
    if (titleBar.hasPointerCapture?.(event.pointerId)) titleBar.releasePointerCapture(event.pointerId);
  };

  titleBar.addEventListener('pointerup', endDrag);
  titleBar.addEventListener('pointercancel', endDrag);

  // Re-centre the window if the viewport shrinks below its size.
  addEventListener('resize', () => {
    termWindow.style.left = '';
    termWindow.style.top = '';
  });

  greet();

})();
