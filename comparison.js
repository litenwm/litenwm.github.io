(() => {
  const root=document.getElementById('paired-comparison');
  const videos=[0,1].map(i=>document.getElementById('pair-video-'+i));
  const tabs=[...document.querySelectorAll('[data-pair-scene]')];
  const play=document.getElementById('pair-play'),seek=document.getElementById('pair-seek'),rate=document.getElementById('pair-rate'),time=document.getElementById('pair-time');
  const lengths=[[17.4,17.4],[24.3,20.733333],[69.433333,43.4]];
  let scene=0,wanted=false,buffering=false,version=0;
  const total=()=>Math.max(...lengths[scene])+5;
  const master=()=>videos[lengths[scene][0]>=lengths[scene][1]?0:1];
  const stamp=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
  function render(){const t=master().currentTime||0;seek.value=t;time.value=stamp(t)+' / '+stamp(total());play.textContent=wanted?'Pause':'Play';play.setAttribute('aria-label',wanted?'Pause both videos':'Play both videos');videos.forEach((v,i)=>{document.getElementById('pair-state-'+i).textContent=v.currentTime>=lengths[scene][i]-.05?'Final view':'';});}
  function pause(){const wasPlaying=wanted;wanted=false;buffering=false;version++;videos.forEach(v=>v.pause());render();if(wasPlaying)document.dispatchEvent(new Event('stop-comparison'));}
  async function resume(){const token=version;videos.forEach(v=>{v.playbackRate=+rate.value;v.preload='auto';});const t=master().currentTime;const results=await Promise.allSettled(videos.map((v,i)=>t<lengths[scene][i]+4.95?v.play():Promise.resolve()));if(token!==version)return;if(results.some(r=>r.status==='rejected'))pause();}
  function start(){if(master().currentTime>=total()-.15)jump(0);wanted=true;buffering=false;document.dispatchEvent(new Event('start-comparison'));resume();render();}
  function jump(t){videos.forEach((v,i)=>{const end=Number.isFinite(v.duration)?v.duration-.04:lengths[scene][i]+4.95;v.currentTime=Math.max(0,Math.min(t,end));});render();}
  function select(n){pause();version++;scene=n;tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',i===n);tab.tabIndex=i===n?0:-1;});document.getElementById('pair-panel').setAttribute('aria-labelledby',tabs[n].id);const goal=document.getElementById('pair-goal-image');goal.src='assets/comparisons/goal'+(n+1)+'.jpg';goal.parentElement.dataset.image='comparisons/goal'+(n+1)+'.jpg';videos.forEach((v,i)=>{v.src='assets/comparisons/'+(i?'nomad':'LiteNWM')+(n+1)+'.mp4';v.poster=v.src.replace('.mp4','.jpg');v.load();});seek.max=total();seek.value=0;render();}
  play.addEventListener('click',()=>wanted?pause():start());
  document.getElementById('pair-restart').addEventListener('click',()=>{pause();jump(0);});
  seek.addEventListener('input',()=>{jump(+seek.value);if(wanted)resume();});
  rate.addEventListener('change',()=>videos.forEach(v=>v.playbackRate=+rate.value));
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:Math.max(0,Math.min(2,i+(e.key==='ArrowRight'?1:-1)));select(next);tabs[next].focus();});});
  videos.forEach(v=>{v.addEventListener('error',()=>{pause();time.value='Unable to load video';});v.addEventListener('waiting',()=>{if(!wanted)return;buffering=true;videos.forEach(x=>x.pause());});v.addEventListener('ended',()=>{if(v===master())pause();});});
  setInterval(()=>{if(wanted){const t=master().currentTime;const active=videos.filter((v,i)=>t<lengths[scene][i]+4.95);if(buffering){if(active.every(v=>v.readyState>=3&&!v.seeking)){buffering=false;resume();}}else{videos.forEach((v,i)=>{const end=lengths[scene][i]+5;if(v!==master()&&t<end-.05){if(Math.abs(v.currentTime-t)>.15&&!v.seeking)v.currentTime=t;if(v.paused&&!v.seeking)v.play().catch(pause);}else if(t>=end-.05)v.pause();});}}render();},100);
  document.getElementById('pair-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{}});
  document.addEventListener('pause-comparison',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0}).observe(root);
  render();
})();
