(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [...document.querySelectorAll('.research-entry')];
  const names = ['UAV 경로계획', '다중 화점 추적', '항공임무 계획', '정밀농업 탐색'];
  const index = document.createElement('nav');
  index.className = 'research-index';
  index.setAttribute('aria-label', '대표 연구 바로가기');
  entries.forEach((entry, i) => {
    entry.id = `research-${i + 1}`;
    const link = document.createElement('a');
    link.href = `#${entry.id}`;
    link.textContent = names[i];
    index.append(link);
  });
  document.querySelector('#research .section-head').append(index);
  const links = [...index.children];
  const progress = document.querySelector('.reading-progress i');
  let pending = false;
  function update() {
    pending = false;
    const positions = entries.map(el => el.getBoundingClientRect().top);
    const extent = document.documentElement.scrollHeight - innerHeight;
    const active = Math.max(0, positions.findLastIndex(top => top < innerHeight * .52));
    links.forEach((link, i) => link.setAttribute('aria-current', String(i === active)));
    progress.style.transform = `scaleX(${extent > 0 ? Math.min(1, scrollY / extent) : 0})`;
  }
  function request() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  addEventListener('scroll', request, {passive:true});
  addEventListener('resize', request);
  update();
  // Animate the research sequence only. Content remains visible if scripting fails.
  const running = new Set();
  const observer = new IntersectionObserver(items => {
    items.forEach(item => {
      if (!item.isIntersecting) return;
      observer.unobserve(item.target);
      if (reduce.matches || !item.target.animate) return;
      const animation = item.target.animate([
        {opacity:.45, transform:'translateY(30px)'},
        {opacity:1, transform:'translateY(0)'}
      ], {duration:650, easing:'cubic-bezier(.16,1,.3,1)'});
      running.add(animation);
      animation.finished.then(() => running.delete(animation)).catch(() => {});
    });
  }, {threshold:.13});
  entries.forEach(entry => observer.observe(entry));
  reduce.addEventListener('change', () => { if (reduce.matches) running.forEach(a => a.cancel()); });
  const menu = document.querySelector('.nav-more');
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  function themeMeta() {
    document.querySelector('meta[name="theme-color"]').content =
      document.documentElement.dataset.theme === 'dark' ? '#101521' : '#f9f8f4';
  }
  document.getElementById('themeBtn').addEventListener('click', themeMeta);
  themeMeta();
})();
