(() => {
  const videos = [...document.querySelectorAll('.motion-cover')];
  const toggles = [...document.querySelectorAll('[data-motion-toggle]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  let enabled = !reduced.matches;
  toggles.forEach(toggle => { toggle.hidden = false; });

  function update(){
    toggles.forEach(toggle => { toggle.textContent = enabled ? '미리보기 정지' : '미리보기 재생'; toggle.setAttribute('aria-pressed', String(enabled)); });
    for(const video of videos){
      if(!enabled || document.hidden || !visible.has(video)){
        video.pause();
        continue;
      }
      if(!video.hasAttribute('src')) video.src=video.dataset.src;
      video.play().catch(()=>{});
    }
  }
  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    },{threshold:.12});
    for(const video of videos) observer.observe(video);
  }else{
    for(const video of videos) visible.add(video);
  }
  toggles.forEach(toggle => { toggle.onclick=()=>{enabled=!enabled;update();}; });
  reduced.addEventListener('change',()=>{enabled=!reduced.matches;update();});
  document.addEventListener('visibilitychange',update);
  update();
})();
