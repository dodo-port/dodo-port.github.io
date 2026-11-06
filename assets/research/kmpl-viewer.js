(() => {
  const data = window.KMPL_RUN;
  if (!data) { document.querySelector('#source').textContent = '궤적 데이터를 읽지 못했습니다.'; return; }
  const get = id => document.getElementById(id);
  const canvas = get('scene'), ctx = canvas.getContext('2d');
  const run = get('run'), vehicle = get('vehicle'), step = get('step'), play = get('play');
  const maxStep = data.runs[0].frames.length - 1;
  const n = data.goals.length;
  const colors = ['#8db6ff', '#65e2ac', '#ff8288'];
  const center = data.size.map(x => x / 2);
  let yaw = -0.66, pitch = 0.58, zoom = 1, timer = null, pointer = null;
  let width, height, scale;
  step.max = maxStep;
  step.value = Math.round(maxStep * 0.65);
  for (let i = 0; i < n; i++) vehicle.add(new Option('UAV ' + (i + 1), i));
  get('source').prepend('Seed ' + data.seed + ' · γ ' + data.gamma + ' · ' + n + '대. ');

  function project([x,y,z]) {
    const dx = x-center[0], dy = y-center[1], dz = z-center[2];
    const across = Math.cos(yaw)*dx - Math.sin(yaw)*dy;
    const away = Math.sin(yaw)*dx + Math.cos(yaw)*dy;
    return [width/2 + across*scale, height/2 + (away*Math.sin(pitch)-dz*Math.cos(pitch))*scale,
      away*Math.cos(pitch)+dz*Math.sin(pitch)];
  }

  function line(points, color, weight) {
    ctx.beginPath();
    points.forEach((p,i) => { const [x,y] = project(p); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
    ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.stroke();
  }

  function dot(point, radius, color, outline) {
    const [x,y] = project(point);
    ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2);
    ctx.fillStyle = color; ctx.fill();
    if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function draw() {
    if (!width || !height) return;
    const chosen = +vehicle.value, t = +step.value;
    const {frames,state} = data.runs[run.value];
    const [sx,sy,sz] = data.size;
    scale = Math.min(width,height) * zoom / (Math.hypot(sx,sy,sz)*1.07);
    ctx.clearRect(0,0,width,height);
    for(let i=0;i<=8;i++) {
      line([[sx*i/8,0,0],[sx*i/8,sy,0]], '#23344c', 1);
      line([[0,sy*i/8,0],[sx,sy*i/8,0]], '#23344c', 1);
    }
    for(const [end,label,color] of [[[sx,0,0],'X','#9cbcff'],[[0,sy,0],'Y','#9fe0cb'],[[0,0,sz],'Z','#eab4ff']]) {
      line([[0,0,0],end],color,1.2);
      const [x,y]=project(end);ctx.fillStyle=color;ctx.font='700 13px monospace';ctx.fillText(label,x+5,y-5);
    }
    if(get('obstacles').checked) {
      const sorted = data.obstacles.slice().sort((a,b) => project(a)[2]-project(b)[2]);
      for(const p of sorted) dot(p, Math.max(1,data.obstacleRadius*scale), '#a5b7cf20', '#99aacc31');
    }
    for(let i=0;i<n;i++){
      if(chosen>=0 && i!==chosen) continue;
      const path = frames.slice(0,t+1).map(frame=>frame[i]);
      const color = colors[state[t][i]];
      line(path, chosen>=0 ? color : color+'b0', chosen>=0?2.6:1.6);
      dot(data.goals[i],4,'#0a111e','#f9dd8e');
      dot(frames[t][i],chosen>=0?6:4,color,'#0a111e');
      if(chosen>=0){
        const [x,y]=project(frames[t][i]);ctx.fillStyle=color;ctx.font='700 13px monospace';ctx.fillText('UAV '+(i+1),x+9,y-8);
      }
    }
    get('stepText').value = t + ' / ' + maxStep;
    const arrived = state[t].filter(x=>x===1).length, frozen = state[t].filter(x=>x===2).length;
    const label = ['진행 중','도달','정지'];
    get('stats').textContent = chosen < 0 ? '도달 ' + arrived + ' · 정지 ' + frozen + ' · 진행 중 ' + (n-arrived-frozen)
      : 'UAV ' + (chosen+1) + ' · ' + label[state[t][chosen]] + ' · XYZ (' + frames[t][chosen].map(v=>v.toFixed(1)).join(', ') + ')';
  }

  function resize(){
    const bounds = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio,2);
    width = bounds.width; height = bounds.height;
    canvas.width = Math.round(width*dpr);canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function rotate(dx,dy){
    yaw += dx; pitch = Math.max(-1.52,Math.min(1.57,pitch+dy)); draw();
  }
  function magnify(factor){zoom=Math.max(.6,Math.min(3.8,zoom*factor));draw();}
  function stop(){if(timer!==null) clearInterval(timer);timer=null;play.textContent='재생';}
  canvas.addEventListener('pointerdown', e=>{
    if(pointer || e.button!==0) return;
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e=>{
    if(pointer?.id!==e.pointerId) return;
    rotate((e.clientX-pointer.x)*.008,(e.clientY-pointer.y)*.008);
    pointer.x=e.clientX;pointer.y=e.clientY;
  });
  canvas.addEventListener('lostpointercapture', e=>{if(pointer?.id===e.pointerId)pointer=null;});
  canvas.addEventListener('wheel', e=>{e.preventDefault();magnify(Math.exp(-e.deltaY*.001));},{passive:false});
  canvas.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft') rotate(-.15,0);
    else if(e.key==='ArrowRight') rotate(.15,0);
    else if(e.key==='ArrowUp') rotate(0,-.15);
    else if(e.key==='ArrowDown') rotate(0,.15);
    else if(e.key==='+') magnify(1.15);
    else if(e.key==='-') magnify(1/1.15);
    else return;
    e.preventDefault();
  });
  get('zoomIn').onclick=()=>magnify(1.15);
  get('zoomOut').onclick=()=>magnify(1/1.15);
  get('top').onclick=()=>{yaw=0;pitch=Math.PI/2;draw();};
  get('reset').onclick=()=>{yaw=-.66;pitch=.58;zoom=1;draw();};
  play.onclick=()=>{
    if(timer!==null){stop();return;}
    if(+step.value>=maxStep)step.value=0;
    play.textContent='일시정지';
    timer=setInterval(()=>{step.value=Math.min(+step.value+2,maxStep);draw();if(+step.value===maxStep)stop();},40);
  };
  for(const id of ['run','vehicle','obstacles','step']) get(id).addEventListener('input',draw);
  new ResizeObserver(resize).observe(canvas);
  resize();
})();
