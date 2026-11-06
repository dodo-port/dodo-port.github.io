(() => {
  const videos = [...document.querySelectorAll('.motion-cover')];
  const toggles = [...document.querySelectorAll('[data-motion-toggle]')];
  const visible = new Set(), fallback = new Map(), pending = new WeakSet();
  let enabled = true;
  const active = video => enabled && !document.hidden && visible.has(video);
  function syncImage(video){
    const item = fallback.get(video);
    if(!item) return;
    const src = active(video) ? video.dataset.animated : video.poster;
    if(item.image.getAttribute('src') !== src) item.image.src = src;
  }
  function useFallback(video){
    if(!fallback.has(video)){
      const image = document.createElement('img');
      image.className = 'motion-fallback'; image.alt = ''; image.setAttribute('aria-hidden','true');
      image.width = 640; image.height = 360;
      video.parentElement.append(image);
      fallback.set(video,{image});
    }
    video.pause(); syncImage(video);
  }
  function update(){
    toggles.forEach(toggle=>{
      toggle.hidden = false;
      toggle.textContent = enabled ? '미리보기 정지' : '미리보기 재생';
      toggle.setAttribute('aria-pressed',String(enabled));
    });
    for(const video of videos){
      if(fallback.has(video)){syncImage(video);continue;}
      video.autoplay = active(video);
      if(!active(video)){video.pause();continue;}
      if(!video.hasAttribute('src')) video.src = video.dataset.src;
      if(!video.paused || pending.has(video))continue;
      pending.add(video);
      const timer = setTimeout(()=>{if(active(video) && video.paused)useFallback(video);},2500);
      video.play().then(()=>{
        if(!active(video) || fallback.has(video))video.pause();
      }).catch(error=>{
        if(error.name !== 'AbortError')useFallback(video);
      }).finally(()=>{clearTimeout(timer);pending.delete(video);});
    }
  }
  videos.forEach(video=>{
    const frame = document.createElement('div');frame.className='motion-frame';
    video.before(frame);frame.append(video);
    video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;
    video.setAttribute('muted','');video.setAttribute('playsinline','');
    video.addEventListener('canplay',update);
    video.addEventListener('play',()=>{if(!active(video)||fallback.has(video))video.pause();});
    video.addEventListener('error',()=>useFallback(video));
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting && entry.intersectionRatio>0)visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    },{threshold:[0,.12]});
    videos.forEach(video=>observer.observe(video));
  }else videos.forEach(video=>visible.add(video));
  toggles.forEach(toggle=>toggle.addEventListener('click',()=>{enabled=!enabled;update();}));
  document.addEventListener('visibilitychange',update);
  window.addEventListener('pageshow',update);
  update();
})();
