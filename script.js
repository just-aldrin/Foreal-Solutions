(() => {
  document.documentElement.classList.add('js');
  const input = document.querySelector('#idea-input');
  const output = document.querySelector('#idea-output');
  const button = document.querySelector('#shape-idea');
  const responses = [
    'Start with the person who feels this every day.',
    'Make the invisible step visible, then make it simpler.',
    'Find the smallest useful version and put it in someone’s hands.',
    'Turn the question into a testable first move.',
  ];

  button?.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) {
      output.textContent = 'Give the thought a few words, then we can move it forward.';
      input.focus();
      return;
    }
    output.textContent = responses[[...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) % responses.length];
    button.innerHTML = 'Another angle <span>↗</span>';
  });

  input?.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') button.click();
  });

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

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) initBuildSwarm();
})();

function initBuildSwarm() {
  const root = document.querySelector('#swarm-root');
  const cursorsEl = root?.querySelector('.swarm-cursors');
  const overlaysEl = root?.querySelector('.swarm-overlays');
  if (!root || !cursorsEl || !overlaysEl) return;

  document.body.classList.add('swarm-on');
  const isMobile = window.matchMedia('(max-width: 600px)').matches;
  const targets = isMobile ? [
    { selector: '.brand', label: 'identity', color: '#d5f21a', shape: 'arrow' },
    { selector: '.hero-art', label: 'visual', color: '#17d6d3', shape: 'arrow' },
    { selector: '.hero-copy h1', anchorSelector: '.hero-row em', label: 'headline', color: '#ed3c85', shape: 'arrow' },
  ] : [
    { selector: '.brand', label: 'identity', color: '#d5f21a', shape: 'arrow' },
    { selector: '.hero-copy h1', anchorSelector: '.hero-row em', label: 'headline', color: '#ed3c85', shape: 'arrow' },
    { selector: '.hero-art', label: 'visual', color: '#17d6d3', shape: 'arrow' },
    { selector: '.signal-strip', label: 'signal', color: '#6d28d9', shape: 'arrow' },
  ];

  const ARROW = 'M4.6 3.9 C4.2 3.1 4.9 2.4 5.7 2.8 L20.6 9.4 C21.5 9.8 21.4 11.1 20.4 11.3 L13.9 12.9 C13.4 13 13 13.4 12.9 13.9 L11.3 20.4 C11.1 21.4 9.8 21.5 9.4 20.6 Z';
  const svgFor = (shape, color) => {
    if (shape === 'cross') return `<g fill="none" stroke="${color}" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="3" fill="${color}"/></g>`;
    if (shape === 'ibeam') return `<path d="M8 4 H16 M12 4 V20 M8 20 H16" fill="none" stroke="${color}" stroke-width="1.5"/>`;
    return `<path d="${ARROW}" fill="${color}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>`;
  };
  const ease = (value) => 1 - Math.pow(1 - value, 3);
  const cursors = [];
  const overlays = [];

  const cornerPoint = (rect, index, bottom = false) => {
    const fromRight = index % 2 === 0;
    return {
      x: fromRight ? rect.right - 7 : rect.left + 7,
      y: bottom ? rect.bottom - 7 : rect.top + 7,
      fromRight,
    };
  };

  targets.forEach((target, index) => {
    const element = document.querySelector(target.selector);
    if (!element) return;
    const anchorElement = target.anchorSelector ? document.querySelector(target.anchorSelector) : element;
    if (!anchorElement) return;
    const rect = element.getBoundingClientRect();
    const startPoint = cornerPoint(rect, index);
    const cursor = document.createElement('div');
    cursor.className = 'swarm-cursor';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">${svgFor(target.shape, target.color)}</svg><span class="swarm-name">${target.label}</span>`;
    cursor.querySelector('.swarm-name').style.background = target.color;
    if (target.color === '#d5f21a') cursor.querySelector('.swarm-name').style.color = '#121016';
    cursorsEl.appendChild(cursor);

    const overlay = document.createElement('div');
    overlay.className = 'swarm-box';
    overlay.dataset.badge = target.label;
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.transformOrigin = startPoint.fromRight ? 'top right' : 'top left';
    overlaysEl.appendChild(overlay);

    cursors.push({ cursor, element, anchorElement, index, startPoint });
    overlays.push(overlay);
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

  const getRect = (item) => item.element.getBoundingClientRect();
  const placeAtBottom = (item) => {
    const point = cornerPoint(getRect(item), item.index, true);
    item.cursor.style.transform = `translate(${point.x}px, ${point.y}px)`;
  };

  const refreshGeometry = () => {
    cursors.forEach((item, index) => {
      const rect = getRect(item);
      const startPoint = cornerPoint(rect, index);
      item.startPoint = startPoint;
      const box = overlays[index];
      if (!box) return;
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      box.style.transformOrigin = startPoint.fromRight ? 'top right' : 'top left';
    });
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
      const box = overlays[index];
      box.style.transform = `scale(${Math.max(0.02, drag)})`;
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
  window.addEventListener('resize', () => {
    if (!settled) refreshGeometry();
    else {
      refreshGeometry();
      updateAnchoredCursors();
    }
  });
}
