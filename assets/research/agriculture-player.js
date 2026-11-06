(() => {
  const data=window.AGRICULTURE_TRACE;
  if(!data?.episodes?.length)return;
  const $=id=>document.getElementById(id);
  const timeline=$('agTimeline'),play=$('agPlay'),episode=$('agEpisode');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const ns='http://www.w3.org/2000/svg';
  let current,step=0,playing=false,last=0,visible=true,frame=0;
  const charts=[];
  function node(tag,attrs,text){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;}
  const xy=p=>[42+p[0]*9,474-p[1]*9];
  function build(svg,key,color){
    svg.replaceChildren();
    for(let n=0;n<=48;n+=8){
      const [x,y]=xy([n,n]);
      svg.append(node('path',{d:`M${x} 42V474 M42 ${y}H474`,stroke:'#e5e8e5','stroke-width':1,fill:'none'}));
      svg.append(node('text',{x,y:494,'text-anchor':'middle',fill:'#526075','font-size':12},n));
      svg.append(node('text',{x:30,y:y+4,'text-anchor':'end',fill:'#526075','font-size':12},n));
    }
    const dots=current.weeds.map(weed=>{const [cx,cy]=xy(weed);const dot=node('circle',{cx,cy,r:3.6,fill:'#c9cdd2','class':'weed-dot'});svg.append(dot);return dot;});
    const path=node('polyline',{fill:'none',stroke:color,'stroke-width':2,'stroke-linejoin':'round'});
    const point=node('circle',{r:6.5,fill:color,stroke:'#fff','stroke-width':2});
    svg.append(path,point);
    return {key,path,point,dots};
  }
  function draw(){
    const tick=Math.floor(step);
    timeline.value=tick;
    $('agStep').textContent=`Step ${tick} / ${timeline.max}`;
    for(const chart of charts){
      const points=current[chart.key],idx=Math.min(tick,points.length-1);
      chart.path.setAttribute('points',points.slice(0,idx+1).map(p=>xy(p).join(',')).join(' '));
      const [x,y]=xy(points[idx]);chart.point.setAttribute('cx',x);chart.point.setAttribute('cy',y);
      const detection=current.detection[chart.key];let found=0;
      chart.dots.forEach((dot,i)=>{const at=(detection.firstSeen || detection.firstSeenReconstructed)[i],seen=at>=0&&at<=idx;dot.setAttribute('fill',seen?'#111827':'#c9cdd2');if(seen)found++;});
      const prefix=chart.key==='baseline'?'agBaseline':'agProposed';
      $(prefix+'Metric').textContent=`${(found/detection.total*100).toFixed(1)}%`;
      $(prefix+'Count').textContent=`탐지율 · ${found} / ${detection.total}개`;
      $(prefix+'Final').textContent=`최종 탐지율 ${detection.finalPercent.toFixed(1)}% (${detection.truePositives}/${detection.total})`;
      const label=chart.key==='baseline'?'agBaselineStatus':'agProposedStatus';
      $(label).textContent=`기록 ${idx} / ${points.length-1} step${idx===points.length-1?' · 기록 종료':''}`;
    }
  }
  function status(){play.textContent=playing?'일시정지':'재생';play.setAttribute('aria-pressed',String(playing));}
  function loop(now){
    frame=0;
    if(!playing||document.hidden||!visible){last=0;return;}
    if(last)step=Math.min(Number(timeline.max),step+Math.min((now-last)/1000,.1)*Number($('agSpeed').value));
    last=now;draw();
    if(step>=Number(timeline.max)){playing=false;status();return;}
    frame=requestAnimationFrame(loop);
  }
  function resume(){last=0;if(playing&&!frame&&!document.hidden&&visible)frame=requestAnimationFrame(loop);}
  function load(){
    current=data.episodes[Number(episode.value)];step=0;
    timeline.max=Math.max(current.baseline.length,current.proposed.length)-1;
    const b=current.detection.baseline,p=current.detection.proposed;
    $('agHighlight').textContent=`이 사례의 최종 탐지율 ${b.finalPercent.toFixed(1)}% → ${p.finalPercent.toFixed(1)}% · ${(p.finalPercent-b.finalPercent).toFixed(1)}%p 차이`;
    charts.splice(0,charts.length,build($('agBaseline'),'baseline','#345bcb'),build($('agProposed'),'proposed','#bc4a35'));
    draw();status();last=0;
  }
  play.addEventListener('click',()=>{if(step>=Number(timeline.max))step=0;playing=!playing;status();resume();});
  $('agReset').addEventListener('click',()=>{step=0;last=0;draw();});
  episode.addEventListener('change',load);
  timeline.addEventListener('input',()=>{playing=false;step=Number(timeline.value);last=0;status();draw();});
  document.addEventListener('visibilitychange',resume);
  reduce.addEventListener('change',()=>{if(reduce.matches){playing=false;status();}});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{threshold:.05}).observe(document.querySelector('.trajectory-player'));
  document.querySelectorAll('[data-ag-view]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelector('.trajectory-pair').dataset.view=button.dataset.agView;
    document.querySelectorAll('[data-ag-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  load();
})();
