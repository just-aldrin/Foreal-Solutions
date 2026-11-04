// Supabase project: foreal-solutions (gdpcwvcfhvzediqmeqmw).
// Only the public, client-safe publishable key lives here — never the
// secret/service_role key.
const SUPABASE_URL = 'https://gdpcwvcfhvzediqmeqmw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HJUkaMEgqI0dfboFuV_Rnw_3aaCi1kt';
let supabaseClientPromise = null;
function getSupabaseClient() {
  if (supabaseClientPromise) return supabaseClientPromise;
  supabaseClientPromise = new Promise((resolve, reject) => {
    if (window.supabase?.createClient) {
      resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
    script.async = true;
    script.onload = () => resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
    script.onerror = () => reject(new Error('Could not load Supabase client'));
    document.head.appendChild(script);
  });
  return supabaseClientPromise;
}

(() => {
  document.documentElement.classList.add('js');
  const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (motionAllowed) initForealCursorMarks();

  initClock();
  initInquiryForm();
  initViewerPresence();
  initLucideIcons();
  initBuildStories();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  const scenes = document.querySelectorAll('.scroll-scene');
  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-inview');
        else entry.target.classList.remove('is-inview');
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    scenes.forEach((scene) => sceneObserver.observe(scene));
  } else {
    scenes.forEach((scene) => scene.classList.add('is-inview'));
  }

  if (motionAllowed) initBuildSwarm();
})();

function initForealCursorMarks() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const container = document.querySelector('#foreal-cursor-trail');
  if (!container) return;

  const editing = 'input, textarea, select, [contenteditable], [role="textbox"]';
  const blocked = `header, a, button, [role="button"], img, figure, [role="img"], ${editing}`;

  const colors = [
    { bg: '#d5f21a', fg: '#121016' },
    { bg: '#17d6d3', fg: '#121016' },
    { bg: '#ed3c85', fg: '#ffffff' },
    { bg: '#5b17e8', fg: '#ffffff' },
    { bg: '#6d28d9', fg: '#ffffff' },
    { bg: '#e11d48', fg: '#ffffff' },
  ];

  let colorIndex = 0;
  let lastPoint = null;
  const isBlocked = (event) => event.target.closest?.(blocked)
    || document.activeElement?.closest(editing);
  const isSelecting = () => window.getSelection()?.isCollapsed === false;

  // A caret can snap to nearby text even in a blank area. Check its line boxes.
  const isOverText = ({ clientX, clientY }) => {
    const caret = document.caretPositionFromPoint?.(clientX, clientY);
    const text = caret?.offsetNode ?? document.caretRangeFromPoint?.(clientX, clientY)?.startContainer;
    if (text?.nodeType !== Node.TEXT_NODE) return false;
    const range = document.createRange();
    range.selectNodeContents(text);
    return Array.from(range.getClientRects()).some((rect) =>
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
  };

  const clear = () => container.replaceChildren();

  window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    lastPoint = isBlocked(event) || isOverText(event) ? null : event;
    if (!lastPoint) return;
    // Browsers can start a selection at nearby text even from a blank margin.
    window.getSelection()?.removeAllRanges();
    event.preventDefault();
  });
  window.addEventListener('mouseup', () => { lastPoint = null; });
  window.addEventListener('blur', () => { lastPoint = null; clear(); });
  document.addEventListener('selectionchange', () => {
    if (!isSelecting()) return;
    lastPoint = null;
    clear();
  });
  document.addEventListener('focusin', (event) => {
    if (event.target.closest?.(editing)) clear();
  });

  const stamp = (x, y) => {
    const { bg, fg } = colors[colorIndex];
    colorIndex = (colorIndex + 1) % colors.length;
    const mark = document.createElement('span');
    mark.className = 'fcm-mark';
    mark.textContent = 'FOREAL!';
    mark.style.background = bg;
    mark.style.color = fg;
    mark.style.left = `${x}px`;
    mark.style.top = `${y}px`;
    container.appendChild(mark);
    mark.addEventListener('animationend', () => mark.remove(), { once: true });
  };

  window.addEventListener('mousemove', (event) => {
    if (isBlocked(event) || isSelecting() || (event.buttons & 1 && isOverText(event))) {
      lastPoint = null;
      clear();
      return;
    }
    if (!lastPoint || !(event.buttons & 1)) return;
    const dx = event.clientX - lastPoint.clientX;
    const dy = event.clientY - lastPoint.clientY;
    if (Math.abs(dx) < 50 && Math.abs(dy) < 28) return;
    lastPoint = event;
    stamp(event.clientX, event.clientY);
  }, { passive: true });
}

function initLucideIcons() {
  if (!window.lucide) return;
  document.querySelectorAll('svg.icon').forEach((icon) => {
    const paths = icon.innerHTML;
    const name = paths.includes('m12 3-1.8') ? 'sparkles'
      : paths.includes('M12 5v14') && paths.includes('m19 12') ? 'arrow-down'
        : paths.includes('M12 19V5') ? 'arrow-up'
          : paths.includes('M5 12h14') ? 'plus'
            : 'arrow-up-right';
    const replacement = document.createElement('i');
    replacement.className = 'icon';
    replacement.dataset.lucide = name;
    replacement.setAttribute('aria-hidden', 'true');
    icon.replaceWith(replacement);
  });
  window.lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

function initClock() {
  const clock = document.querySelector('#live-clock');
  if (!clock) return;
  const update = () => {
    clock.textContent = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  };
  update();
  window.setInterval(update, 1000);
}

function initBuildStories() {
  const output = document.querySelector('#idea-output');
  const label = document.querySelector('#idea-label');
  const button = document.querySelector('#shape-idea');
  const loader = document.querySelector('#idea-loading');
  if (!output || !label || !button || !loader) return;
  const panel = loader.parentElement;

  const stories = [
    [label.textContent, output.textContent.trim()],
    ['the market question', 'A price tag tells you what lunch costs. AgriChain asks what got it there, using crop supply and demand to make sense of the numbers.'],
    ['the rough drafts', 'The first pitch had company: feedback, rewrites, and late nights. The version that made it out of the classroom had been through all three.'],
    ['the paperwork era', 'The idea went from a competition entry to a DOST–BINHI contract signing. The pitch deck finally met its natural enemy: paperwork.'],
    ['startup lessons', 'Before pitching your solution, ask how someone handled the problem last time. Their workaround tells you what your product has to beat.'],
    ['project management', 'When a feature gets added mid-sprint, ask what moves out. A backlog can grow overnight. A Friday can’t.'],
    ['agriculture', 'A bumper harvest can still leave a farmer with unsold produce. Growing the crop is one job. Getting it to a buyer before it spoils is another.'],
    ['technology', 'A cached forecast loads fast. A timestamp tells you whether it’s still worth trusting.'],
    ['startup motivation', 'After a pitch rejection, write down the question you struggled to answer. Turn it into the next experiment.'],
    ['startup quote', 'A feature is a promise. Ship the one you can keep.'],
  ];
  let index = 0;
  const recent = [output.textContent.trim()];

  button.addEventListener('click', async () => {
    button.disabled = true;
    panel.classList.add('is-loading');
    loader.hidden = false;
    const minimumDisplay = new Promise((resolve) => setTimeout(resolve, 1000));
    let card;
    try {
      const avoid = encodeURIComponent(recent.join('|'));
      const response = await fetch(`./api/trivia?avoid=${avoid}`, { signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        const { trivia, label: topic } = await response.json();
        if (trivia && topic && !recent.includes(trivia)) card = [topic, trivia];
      }
    } catch {
      // The homepage also runs on static hosts without the generator.
    }
    await minimumDisplay;
    if (!card) {
      index = (index + 1) % stories.length;
      card = stories[index];
    }
    const [topic, story] = card;
    label.textContent = topic;
    output.textContent = story;
    recent.push(story);
    if (recent.length > 4) recent.shift();
    loader.hidden = true;
    panel.classList.remove('is-loading');
    button.disabled = false;
  });
}

function initInquiryForm() {
  const form = document.querySelector('#inquiry-form');
  const status = document.querySelector('#inquiry-status');
  if (!form || !status) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Sending your inquiry…';
    try {
      const data = Object.fromEntries(new FormData(form));
      const client = await getSupabaseClient();
      const { error } = await client.from('collaboration_inquiries').insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        project: data.project,
        details: data.details,
      });
      if (error) throw error;
      form.reset();
      status.textContent = 'Thanks — your inquiry is in. We’ll reply soon.';
    } catch (error) {
      status.textContent = 'Could not send right now. Please email foreal.solutions@gmail.com.';
    } finally {
      submit.disabled = false;
    }
  });
}

function initViewerPresence() {
  const count = document.querySelector('#viewer-count');
  if (!count) return;
  const visitorId = localStorage.getItem('foreal-visitor-id')
    || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  localStorage.setItem('foreal-visitor-id', visitorId);

  const setLabel = (n) => {
    count.innerHTML = `<i class="viewer-dot"></i> ${n} LIVE VIEWER${n === 1 ? '' : 'S'}`;
    count.classList.remove('is-offline');
  };
  const setOffline = () => {
    count.innerHTML = '<i class="viewer-dot"></i> LIVE VIEWERS UNAVAILABLE';
    count.classList.add('is-offline');
  };

  getSupabaseClient().then((client) => {
    const channel = client.channel('foreal-site-visitors', { config: { presence: { key: visitorId } } });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setLabel(Object.keys(state).length || 1);
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString(), page: location.pathname });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setOffline();
      }
    });
    window.addEventListener('beforeunload', () => channel.untrack());
  }).catch(setOffline);
}

function initBuildSwarm() {
  const root = document.querySelector('#swarm-root');
  const cursorsEl = root?.querySelector('.swarm-cursors');
  const overlaysEl = root?.querySelector('.swarm-overlays');
  if (!root || !cursorsEl || !overlaysEl) return;

  document.body.classList.add('swarm-on');

  // Page-load intro: arrow cursors fly in and label real UI elements.
  // Box always matches the exact element being labeled (anchorSelector),
  // so the highlight never frames the wrong thing.
  const isMobile = window.matchMedia('(max-width: 600px)').matches;
  const targets = document.querySelector('.blog-page') ? [
    { selector: '.brand', label: 'identity', color: '#d5f21a', shape: 'arrow' },
    { selector: '.blog-page h1', label: 'headline', color: '#ed3c85', shape: 'arrow' },
  ] : isMobile ? [
    { selector: '.brand', label: 'identity', color: '#d5f21a', shape: 'arrow' },
    { selector: '.art-card-main', label: 'visual', color: '#17d6d3', shape: 'arrow' },
    { selector: '.hero-copy h1', label: 'headline', color: '#ed3c85', shape: 'arrow' },
  ] : [
    { selector: '.brand', label: 'identity', color: '#d5f21a', shape: 'arrow' },
    { selector: '.hero-copy h1', label: 'headline', color: '#ed3c85', shape: 'arrow' },
    { selector: '.art-card-main', label: 'visual', color: '#17d6d3', shape: 'arrow' },
    { selector: '.signal-strip', label: 'signal', color: '#6d28d9', shape: 'arrow' },
  ];

  const svgFor = (shape, color) => `<g fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3.5 20 11c1.2.6 1.1 2.3-.1 2.7l-5.7 1.8-1.8 5.7c-.4 1.2-2.1 1.3-2.7.1Z"/><path d="m13.5 13.5 5.5 5.5"/></g>`;
  const ease = (value) => 1 - Math.pow(1 - value, 3);
  const cursors = [];

  const cornerPoint = (rect, index, bottom = false) => {
    const fromRight = index % 2 === 0;
    return {
      x: fromRight ? rect.right - 7 : rect.left + 7,
      y: bottom ? rect.bottom - 7 : rect.top + 7,
    };
  };

  targets.forEach((target, index) => {
    if (!document.querySelector(target.selector)) return;
    const cursor = document.createElement('div');
    cursor.className = 'swarm-cursor';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">${svgFor(target.shape, target.color)}</svg><span class="swarm-name">${target.label}</span>`;
    cursor.querySelector('.swarm-name').style.background = target.color;
    if (target.color === '#d5f21a') cursor.querySelector('.swarm-name').style.color = '#121016';
    cursorsEl.appendChild(cursor);

    const overlay = document.createElement('div');
    overlay.className = 'swarm-box';
    overlay.dataset.badge = target.label;
    overlay.style.setProperty('--swarm-color', target.color);
    overlaysEl.appendChild(overlay);

    cursors.push({ cursor, overlay, anchorSelector: target.selector, index });
  });

  const started = performance.now();
  const arrivalDuration = 720;
  const holdDuration = 110;
  const dragDuration = 760;
  const settleDuration = 260;
  const gap = 300;
  const startPositions = cursors.map((_, index) => ({
    x: index % 2 ? innerWidth + 34 : -34,
    y: Math.max(42, Math.min(innerHeight - 120, innerHeight * 0.2 + index * 40)),
  }));
  let settled = false;
  let anchorFrame = 0;

  const getRect = (item) => document.querySelector(item.anchorSelector).getBoundingClientRect();
  const placeAtBottom = (item) => {
    const point = cornerPoint(getRect(item), item.index, true);
    item.cursor.style.transform = `translate(${point.x}px, ${point.y}px)`;
  };

  const render = (now) => {
    const elapsed = now - started;
    cursors.forEach((item, index) => {
      const local = Math.max(0, elapsed - index * gap);
      const rect = getRect(item);
      const startPoint = cornerPoint(rect, index);
      const endPoint = cornerPoint(rect, index, true);
      const travel = ease(Math.min(1, local / arrivalDuration));
      const drag = ease(Math.max(0, Math.min(1, (local - arrivalDuration - holdDuration) / dragDuration)));
      const settle = ease(Math.max(0, Math.min(1, (local - arrivalDuration - holdDuration - dragDuration) / settleDuration)));
      const start = startPositions[index];
      const cursorX = local < arrivalDuration
        ? start.x + (startPoint.x - start.x) * travel
        : startPoint.x + (endPoint.x - startPoint.x) * Math.max(drag, settle);
      const cursorY = local < arrivalDuration
        ? start.y + (startPoint.y - start.y) * travel
        : startPoint.y + (endPoint.y - startPoint.y) * Math.max(drag, settle);
      item.cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

      const drawing = local >= arrivalDuration + holdDuration;
      const complete = local >= arrivalDuration + holdDuration + dragDuration + settleDuration;
      item.cursor.classList.toggle('is-building', !complete);
      item.cursor.classList.toggle('is-settled', complete);
      const box = item.overlay;
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      box.style.opacity = drawing ? `${Math.min(1, drag * 1.5)}` : '0';
    });

    const total = (targets.length - 1) * gap + arrivalDuration + holdDuration + dragDuration + settleDuration + 220;
    if (elapsed < total) {
      requestAnimationFrame(render);
    } else {
      settled = true;
      root.classList.add('swarm-complete');
      overlaysEl.innerHTML = '';
      cursors.forEach((item) => {
        item.cursor.classList.add('is-settled');
        placeAtBottom(item);
      });
    }
  };
  requestAnimationFrame(render);

  const updateAnchoredCursors = () => {
    if (!settled || anchorFrame) return;
    anchorFrame = requestAnimationFrame(() => {
      anchorFrame = 0;
      cursors.forEach(placeAtBottom);
    });
  };
  window.addEventListener('scroll', updateAnchoredCursors, { passive: true });
  window.addEventListener('hashchange', updateAnchoredCursors);
  window.addEventListener('resize', updateAnchoredCursors);
}
