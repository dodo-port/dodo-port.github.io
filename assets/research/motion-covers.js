(() => {
  const videos = [...document.querySelectorAll('.motion-cover')];
  const toggles = [...document.querySelectorAll('[data-motion-toggle]')];
  const visible = new Set(), blocked = new Set(), pending = new WeakSet();
  // Research previews start enabled; decorative motion still follows OS preferences.
  let enabled = true;
  function labels(){
    const needsTap = enabled && [...visible].some(video => blocked.has(video));
    toggles.forEach(toggle => {
      toggle.hidden = false;
      toggle.textContent = !enabled || needsTap ? '미리보기 재생' : '미리보기 정지';
      toggle.setAttribute('aria-pressed', String(enabled && !needsTap));
    });
  }
  function update(){
    for(const video of videos){
      const active = enabled && !document.hidden && visible.has(video);
      video.autoplay = active;
      if(!active){ video.pause(); continue; }
      if(!video.hasAttribute('src')) video.src = video.dataset.src;
      if(!video.paused || pending.has(video)) continue;
      pending.add(video);
      video.play().then(()=>{
        blocked.delete(video);
        if(!enabled || document.hidden || !visible.has(video)) video.pause();
      }).catch(error=>{
        if(error.name === 'NotAllowedError') blocked.add(video);
      }).finally(()=>{pending.delete(video);labels();});
    }
    labels();
  }
  videos.forEach(video=>{
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.addEventListener('canplay',update);
    video.addEventListener('play',()=>{
      if(!enabled || document.hidden || !visible.has(video)) video.pause();
    });
  });
  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    },{threshold:[0,.12]});
    videos.forEach(video=>observer.observe(video));
  }else videos.forEach(video=>visible.add(video));
  toggles.forEach(toggle=>toggle.addEventListener('click',()=>{
    if(enabled && [...visible].some(video=>blocked.has(video))) blocked.clear();
    else enabled = !enabled;
    update();
  }));
  // Retry policy-blocked muted playback on a real user interaction.
  document.addEventListener('touchend',()=>{if(enabled)update();},{passive:true});
  document.addEventListener('click',event=>{if(enabled && !event.target.closest('[data-motion-toggle]'))update();});
  document.addEventListener('visibilitychange',update);
  window.addEventListener('pageshow',update);
  update();
})();
