(() => {
  const button=document.getElementById('expandWildfire'),video=document.getElementById('wildfireVideo');
  if(!button||!video)return;
  const home=video.parentElement;
  const dialog=document.createElement('dialog');dialog.className='video-dialog';dialog.setAttribute('aria-label','화점 추적 영상 확대');
  const bar=document.createElement('div');bar.className='video-dialog-bar';
  const hint=document.createElement('span');hint.textContent='가로로 돌리면 더 크게 볼 수 있습니다.';
  const close=document.createElement('button');close.type='button';close.textContent='닫기 ×';
  bar.append(hint,close);dialog.append(bar);document.body.append(dialog);
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{home.append(video);button.focus();});
  button.addEventListener('click',async()=>{
    try {
      if(video.requestFullscreen){await video.requestFullscreen();return;}
      if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();return;}
    } catch (_) {}
    dialog.append(video);dialog.showModal();close.focus();
  });
})();
