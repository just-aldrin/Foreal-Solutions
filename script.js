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

  initBuildStories();
  initClock();
  initInquiryForm();
  initViewerPresence();
  initLucideIcons();

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

  // A short, playful blip per stamp -- synthesized, no audio file needed.
  let audioCtx = null;
  const ensureAudio = () => {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  };
  const NOTES = [392.0, 440.0, 493.88, 587.33, 659.25, 739.99]; // little ascending run, one note per color
  const playBlip = (index) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = NOTES[index % NOTES.length];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  };

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
    playBlip(colorIndex);
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
  const button = document.querySelector('#shape-idea');
  if (!button) return;
  const flip = button.querySelector('.machine-flip');
  const faces = [...flip.children];
  const loader = button.querySelector('#idea-loading');
  const announcement = document.querySelector('#idea-announcement');
  const layers = [...button.querySelectorAll('.machine-stack-layer')];
  const firstTopic = faces[0].querySelector('.output-label').textContent;
  const firstStory = faces[0].querySelector('strong').textContent;

  const stories = [
    [firstTopic, firstStory],
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

  // The stacked cards behind the front one aren't blank -- give each a
  // real preview line pulled from the same story bank.
  let queueCursor = layers.length + 1; // index 0 = front card, 1..layers.length already used by the initial stack
  layers.forEach((layer, i) => {
    const [topic, story] = stories[(i + 1) % stories.length];
    layer.innerHTML = `<span class="machine-stack-layer-label">${topic}</span><span class="machine-stack-layer-line">${story.slice(0, 64)}…</span>`;
  });

  // Real FIFO: the nearest card in the stack graduates to become the new
  // front card, every other card physically moves one slot closer, and a
  // fresh card joins at the back. No bounce-back -- the DOM order actually
  // changes, so the CSS transition on .machine-stack-layer animates the
  // real move.
  const advanceStackQueue = () => {
    const stack = button.querySelector('.machine-stack');
    const current = [...stack.querySelectorAll('.machine-stack-layer')];
    if (!current.length) return;
    // Freeze everyone's current on-screen position so removing/inserting
    // nodes doesn't cause a visual jump.
    current.forEach((layer) => {
      const cs = getComputedStyle(layer);
      layer.style.transform = cs.transform === 'none' ? '' : cs.transform;
      layer.style.opacity = cs.opacity;
      layer.style.transition = 'none';
    });
    void stack.offsetWidth; // flush the freeze before mutating

    current[current.length - 1].remove(); // nearest card graduates to the front

    const fresh = document.createElement('span');
    fresh.className = 'machine-stack-layer';
    const [topic, story] = stories[queueCursor % stories.length];
    queueCursor += 1;
    fresh.innerHTML = `<span class="machine-stack-layer-label">${topic}</span><span class="machine-stack-layer-line">${story.slice(0, 64)}…</span>`;
    fresh.style.transition = 'none';
    fresh.style.opacity = '0';
    stack.insertBefore(fresh, stack.firstChild);
    void stack.offsetWidth;

    requestAnimationFrame(() => {
      [...stack.querySelectorAll('.machine-stack-layer')].forEach((layer) => {
        layer.style.transition = '';
        layer.style.transform = '';
        layer.style.opacity = '';
      });
    });
  };

  const trackTilt = (event) => {
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = (event.clientY - rect.top) / rect.height * 2 - 1;
    // Tilt AWAY from the cursor, not toward it.
    button.style.setProperty('--deck-pitch', `${-y * 14}deg`);
    button.style.setProperty('--deck-yaw', `${x * 17}deg`);
    button.style.setProperty('--deck-roll', `${x * 5}deg`);
    button.classList.add('is-tracking');
  };
  button.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    if (dragging) return;
    button.classList.remove('is-touch');
    trackTilt(event);
  }, { passive: true });
  button.addEventListener('pointerleave', () => { if (!dragging) button.classList.remove('is-tracking'); });
  button.addEventListener('pointercancel', () => { if (!dragging) button.classList.remove('is-tracking'); });

  let activeFace = 0;
  let previousCategory = '';
  const seen = [firstStory];
  const words = (text) => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const isFresh = (text) => {
    const candidate = words(text);
    return candidate.size > 0 && !seen.some((story) => {
      const previous = words(story);
      const shared = [...candidate].filter((word) => previous.has(word)).length;
      return shared / (candidate.size + previous.size - shared) >= 0.72;
    });
  };

  const drawNewCard = async () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    button.setAttribute('aria-disabled', 'true');
    const outgoing = faces[activeFace];
    const nextFace = 1 - activeFace;
    const incoming = faces[nextFace];
    const topicEl = incoming.querySelector('.output-label');
    const storyEl = incoming.querySelector('strong');
    const hint = incoming.querySelector('.machine-hint').firstChild;
    incoming.append(loader);
    incoming.classList.add('is-loading');
    loader.hidden = false;
    announcement.textContent = 'Pulling up something good…';
    const minimumDisplay = new Promise((resolve) => setTimeout(resolve, 1000));
    flip.classList.toggle('is-flipped', nextFace === 1);
    button.classList.remove('is-cycling');
    void button.offsetWidth; // restart the animation even if clicked again fast
    button.classList.add('is-cycling');
    button.addEventListener('animationend', () => button.classList.remove('is-cycling'), { once: true });
    advanceStackQueue();
    const request = new AbortController();
    const requestTimeout = setTimeout(() => request.abort(), 24000);
    let card;
    try {
      const avoid = seen.slice(-8);
      for (let attempt = 0; attempt < 2 && !card; attempt += 1) {
        const params = new URLSearchParams({ avoid: avoid.slice(-8).join('|'), previousCategory });
        const response = await fetch(`./api/trivia?${params}`, { signal: request.signal, cache: 'no-store' });
        if (!response.ok) break;
        const { trivia, label: topic, category } = await response.json();
        if (typeof trivia !== 'string' || typeof topic !== 'string') break;
        if (isFresh(trivia)) {
          card = [topic, trivia];
          previousCategory = category || '';
        } else {
          avoid.push(trivia);
        }
      }
    } catch {
      // The homepage also runs on static hosts without the generator.
    } finally {
      clearTimeout(requestTimeout);
    }
    await minimumDisplay;
    card ??= stories.find(([, story]) => isFresh(story));
    if (card) {
      const [topic, story] = card;
      topicEl.textContent = topic;
      storyEl.textContent = story;
      hint.textContent = 'Flip for the next card ';
      seen.push(story);
      announcement.textContent = `${topic}. ${story}`;
    } else {
      const message = 'No fresh card yet. Try again.';
      topicEl.textContent = outgoing.querySelector('.output-label').textContent;
      storyEl.textContent = outgoing.querySelector('strong').textContent;
      hint.textContent = message + ' ';
      announcement.textContent = message;
    }
    loader.hidden = true;
    incoming.classList.remove('is-loading');
    activeFace = nextFace;
    button.removeAttribute('aria-disabled');
  };

  button.addEventListener('click', () => {
    if (suppressClick) { suppressClick = false; return; }
    drawNewCard();
  });

  // Drag the card away (aggressively) to toss it and draw a new one --
  // a light drag just snaps back, same as the hover tilt does nothing
  // drastic on its own.
  let dragging = false;
  let dragMoved = false;
  let suppressClick = false;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let activePointerId = null;
  const DRAG_THRESHOLD = 8;
  const FLING_DISTANCE = 110;
  const FLING_VELOCITY = 0.6; // px/ms

  const setDrag = (dx, dy) => {
    button.style.setProperty('--deck-drag-x', `${dx}px`);
    button.style.setProperty('--deck-drag-y', `${dy * 0.4}px`);
    button.style.setProperty('--deck-drag-rotate', `${Math.max(-22, Math.min(22, dx * 0.08))}deg`);
  };
  const resetDrag = () => {
    button.style.removeProperty('--deck-drag-x');
    button.style.removeProperty('--deck-drag-y');
    button.style.removeProperty('--deck-drag-rotate');
  };

  button.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    if (button.getAttribute('aria-disabled') === 'true') return;
    dragging = true;
    dragMoved = false;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    activePointerId = event.pointerId;
    try { button.setPointerCapture(event.pointerId); } catch (e) {}
    if (event.pointerType === 'touch') { button.classList.add('is-touch'); trackTilt(event); }
  });

  button.addEventListener('pointermove', (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!dragMoved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      dragMoved = true;
      button.classList.add('is-dragging');
    }
    if (dragMoved) {
      event.preventDefault();
      setDrag(dx, dy);
    }
  });

  const endDrag = (event) => {
    if (!dragging || (event.pointerId !== undefined && event.pointerId !== activePointerId)) return;
    dragging = false;
    button.classList.remove('is-dragging', 'is-tracking', 'is-touch');
    if (!dragMoved) { resetDrag(); return; }
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const elapsed = Math.max(1, performance.now() - startTime);
    const distance = Math.hypot(dx, dy);
    const velocity = distance / elapsed;
    suppressClick = true;
    const MIN_FLING_DISTANCE = 36; // guards against misreading a quick click as an aggressive drag
    if (distance > FLING_DISTANCE || (distance > MIN_FLING_DISTANCE && velocity > FLING_VELOCITY)) {
      const flyX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(dx);
      button.classList.add('is-flung');
      setDrag(flyX * Math.max(820, Math.abs(dx) * 2.4), dy * 1.8);
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        button.classList.remove('is-flung');
        button.classList.add('is-dragging'); // skip the transition for the instant reset
        resetDrag();
        requestAnimationFrame(() => button.classList.remove('is-dragging'));
        drawNewCard();
      };
      // transitionend should fire this, but don't rely on it alone --
      // a guaranteed timer backs it up in case the browser skips the event.
      const stack = button.querySelector('.machine-stack');
      stack.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') settle(); }, { once: true });
      setTimeout(settle, 420);
    } else {
      resetDrag();
    }
    dragMoved = false;
  };
  button.addEventListener('pointerup', endDrag);
  button.addEventListener('pointercancel', (event) => {
    dragging = false;
    dragMoved = false;
    button.classList.remove('is-dragging', 'is-tracking', 'is-touch', 'is-flung');
    resetDrag();
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
  const label = count.querySelector('.viewer-label');
  const stack = count.querySelector('.viewer-avatars');
  const avatars = stack.querySelectorAll('.viewer-avatar');
  const overflow = stack.querySelector('.viewer-overflow');
  const visitorId = localStorage.getItem('foreal-visitor-id')
    || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  localStorage.setItem('foreal-visitor-id', visitorId);

  const setLabel = (n) => {
    label.textContent = `${n} LIVE VIEWER${n === 1 ? '' : 'S'}`;
    avatars.forEach((avatar, index) => { avatar.hidden = index >= n; });
    overflow.hidden = n <= avatars.length;
    stack.hidden = false;
    count.classList.remove('is-offline');
  };
  const setOffline = () => {
    label.textContent = 'LIVE VIEWERS UNAVAILABLE';
    stack.hidden = true;
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

  // A quick chalk-scratch sound plays the instant a box starts framing its
  // element -- synthesized filtered noise, no audio file needed.
  let swarmAudioCtx = null;
  const ensureSwarmAudio = () => {
    if (!swarmAudioCtx) {
      try { swarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (swarmAudioCtx.state === 'suspended') swarmAudioCtx.resume().catch(() => {});
    return swarmAudioCtx;
  };
  // Browsers mute audio until a real user gesture happens -- and the
  // swarm runs itself the instant the page loads, so on a first-ever
  // visit it can finish its whole run before any click/tap occurs,
  // which drops every one of its sounds silently. missedDings counts
  // those drops; the moment a gesture finally lands, we fire a quick
  // catch-up chime so the feature is never just mysteriously silent.
  let missedDings = 0;
  const playDing = (ctx, at) => {
    const notes = [1046.5, 1318.5]; // C6 -> E6, a quick confident "ding"
    notes.forEach((freq, i) => {
      const t = at + i * 0.045;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  };
  const primeSwarmAudio = () => {
    const ctx = ensureSwarmAudio();
    if (!ctx) return;
    const replay = () => {
      if (missedDings <= 0) return;
      const count = Math.min(missedDings, 4);
      const now = ctx.currentTime + 0.05;
      for (let i = 0; i < count; i += 1) playDing(ctx, now + i * 0.13);
      missedDings = 0;
    };
    if (ctx.state === 'running') replay();
    else ctx.resume().then(replay).catch(() => {});
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((type) => {
    document.addEventListener(type, primeSwarmAudio, { once: true, passive: true });
  });
  // durationSec must match exactly how long that cursor's box takes to
  // draw (dragDuration below) -- a clean synth blip, no noise/texture:
  // a soft tick the instant framing starts, then a crisp two-note
  // ascending "ding" the instant it locks into place.
  const playFrameBlip = (durationSec) => {
    const ctx = ensureSwarmAudio();
    if (!ctx) return;
    if (ctx.state !== 'running') missedDings += 1;
    const now = ctx.currentTime;

    const startTick = ctx.createOscillator();
    startTick.type = 'sine';
    startTick.frequency.value = 880;
    const startGain = ctx.createGain();
    startGain.gain.setValueAtTime(0, now);
    startGain.gain.linearRampToValueAtTime(0.035, now + 0.012);
    startGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    startTick.connect(startGain).connect(ctx.destination);
    startTick.start(now);
    startTick.stop(now + 0.08);

    playDing(ctx, now + durationSec);
  };

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

    cursors.push({ cursor, overlay, anchorSelector: target.selector, index, soundPlayed: false });
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
      if (drawing && !item.soundPlayed) {
        item.soundPlayed = true;
        playFrameBlip(dragDuration / 1000);
      }
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
