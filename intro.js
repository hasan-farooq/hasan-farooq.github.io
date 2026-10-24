(() => {
  const demo = document.querySelector('.model-demo');
  if (!demo) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const play = demo.querySelector('.demo-play');
  let stage = 0, lower = false, paused = false, timer, started = false;
  function render() {
    const location = lower ? 'below' : 'above';
    const frames = [
      ['A plausible guess can ignore the image. Here, the answer contradicts the visible relationship.', lower ? '“Yes, it is above.”' : '“No, it is below.”', 'Unsupported answer'],
      ['Ground the objects first: locate the circle and the square in the image.', 'Locating both objects…', 'Visual evidence selected'],
      ['Compare the grounded positions instead of relying on a familiar answer pattern.', `The circle is ${location} the square.`, 'Spatial relationship checked'],
      ['Use that relationship to produce an answer supported by the image.', lower ? '“No, it is below.”' : '“Yes, it is above.”', 'Image-supported answer']
    ];
    demo.dataset.stage = String(stage);
    demo.dataset.lower = String(lower);
    demo.dataset.mode = stage === 0 ? 'hallucination' : 'reasoning';
    demo.dataset.paused = String(paused);
    demo.querySelector('.demo-query').textContent = '“Is the circle above the square?”';
    demo.querySelector('.synthetic-image').setAttribute('aria-label', `Circle in the ${lower ? 'lower' : 'upper'} right, square at center left.`);
    demo.querySelector('.demo-explanation').textContent = frames[stage][0];
    demo.querySelector('.answer-value').textContent = frames[stage][1];
    demo.querySelector('.answer-status').textContent = frames[stage][2];
    const labels = ['Guess', 'Ground', 'Reason'];
    demo.querySelectorAll('.process-node').forEach((node, i) => {
      node.textContent = labels[i];
      node.classList.toggle('active', i <= Math.min(stage, 2));
      node.classList.toggle('current', i === Math.min(stage, 2));
    });
    demo.querySelector('.demo-takeaway').textContent = 'From a plausible guess to a grounded spatial answer. Move the circle to try again.';
    play.textContent = stage === 3 ? 'Replay ↻' : paused ? 'Resume' : 'Pause';
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || stage === 3 || demo.dataset.theme !== 'grounded') return;
    timer = setTimeout(() => { stage++; render(); schedule(); }, 2600);
  }
  function start() { stage = reduced.matches ? 3 : 0; paused = false; started = true; render(); schedule(); }
  demo.querySelector('.change-image').addEventListener('click', () => { lower = !lower; start(); });
  play.addEventListener('click', () => { if (stage === 3) start(); else { paused = !paused; render(); schedule(); } });
  demo.addEventListener('restart-grounding', start);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else if (started) schedule(); });
  reduced.addEventListener('change', () => { if (reduced.matches) { clearTimeout(timer); stage = 3; render(); } });
  render();
  if (reduced.matches) { stage = 3; render(); }
  else {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting) && !started) { start(); observer.disconnect(); } }, {threshold:.25});
    observer.observe(demo);
  }
})();

(() => {
  const button = document.querySelector('.copy-email');
  if (!button) return;
  const label = button.querySelector('.copy-label');
  const status = document.querySelector('.copy-status');
  const link = document.querySelector('.contact-line > a');
  const email = 'hasan.farooq@lhr.nu.edu.pk';
  let field;
  button.addEventListener('click', () => {
    if (!field) {
      field = document.createElement('input');
      field.type = 'text';
      field.readOnly = true;
      field.value = email;
      field.className = 'email-copy-field';
      field.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      field.tabIndex = -1;
      field.setAttribute('aria-label', 'Email address — select and copy');
      link.after(field);
    }
    field.hidden = false;
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, email.length);
    try { document.execCommand('copy'); } catch { /* Keep selected for manual copying. */ }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).catch(() => {});
    }
    button.focus({ preventScroll: true });
    label.textContent = 'Copied';
    status.textContent = 'Email address copied.';
    status.classList.remove('copy-error');
    setTimeout(() => {
      label.textContent = 'Copy';
      status.textContent = '';
      field.hidden = true;
      link.hidden = false;
    }, 2200);
    field.addEventListener('copy', () => {
      label.textContent = 'Copied';
      status.textContent = 'Email address copied.';
    }, { once: true });
  });
})();

(() => {
  const root = document.querySelector('.model-demo');
  const themes = [...root.querySelectorAll('.experiment-themes button')];
  themes.forEach(button => button.addEventListener('click', () => {
    root.dataset.theme = button.dataset.theme;
    themes.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    root.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== button.dataset.theme; });
    if (button.dataset.theme === 'grounded') root.dispatchEvent(new Event('restart-grounding'));
  }));
  const training = root.querySelector('.training-map');
  const strategies = {
    full: ['Adapt learned representations', 'How does updating a pretrained model change the representations it has learned?', []],
    adapter: ['Change only what matters', 'Can a small set of trainable parameters introduce new capabilities while preserving existing representations?', []],
    data: ['Learn from informative examples', 'Which examples reveal something new? Diversity, relevance, and supervision can matter as much as the number of examples.', []],
    compute: ['Learn from richer signals', 'Can concepts, locations, or relationships provide a more useful learning signal than an answer alone?', []]
  };
  root.querySelectorAll('.training-policy').forEach(button => button.addEventListener('click', () => {
    const policy = button.dataset.policy;
    training.dataset.adapter = String(policy === 'adapter');
    training.dataset.strategy = policy;
    root.querySelectorAll('.training-policy').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    root.querySelector('.training-value').textContent = strategies[policy][0];
    root.querySelector('.training-copy').textContent = strategies[policy][1];
    training.setAttribute('aria-label', strategies[policy][0] + '. Conceptual view of model adaptation.');
  }));
  const environments = {
    data:['Same concept, different appearance','Lighting, viewpoint, and visual style can change while the underlying concept stays the same. Which features should a model preserve?'],
    resources:['Familiar ideas, unfamiliar contexts','A concept may appear in a setting absent from training. Can the model transfer what it knows, rather than depend on familiar surroundings?'],
    reliability:['Knowing when the evidence is insufficient','An unfamiliar or ambiguous image may not support a clear answer. Can a model recognize the limits of its evidence?']
  };
  root.querySelectorAll('[data-environment]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-environment]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    const content = environments[button.dataset.environment];
    root.querySelector('.generalization-sketch').dataset.view = button.dataset.environment;
    root.querySelector('.environment-title').textContent = content[0];
    root.querySelector('.environment-copy').textContent = content[1];
  }));
})();

(() => {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  function sync() {
    const dark = document.documentElement.dataset.theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.querySelector('.theme-toggle-label').textContent = dark ? 'Light' : 'Dark';
    button.querySelector('[aria-hidden]').textContent = dark ? '☀' : '☾';
  }
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('portfolio-theme', next); } catch { /* Theme still works without persistence. */ }
    sync();
  });
  sync();
})();
