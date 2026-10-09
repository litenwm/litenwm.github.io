(() => {
  const sectionLinks=[...document.querySelectorAll('.section-nav a')];
  const navTargets=sectionLinks.map(a=>document.querySelector(a.hash));
  let navFrame=0;
  function updateSection(){navFrame=0;let selected=-1;navTargets.forEach((el,i)=>{if(el&&el.getBoundingClientRect().top<=125)selected=i;});sectionLinks.forEach((a,i)=>{if(i===selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
  addEventListener('scroll',()=>{if(!navFrame)navFrame=requestAnimationFrame(updateSection);},{passive:true});
  updateSection();
  document.querySelectorAll('.table-container').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label',el.querySelector('table').getAttribute('aria-label')+'; scroll horizontally on narrow screens');});
  const dialog=document.getElementById('media-dialog');
  const player=document.getElementById('dialog-video');
  const picture=document.getElementById('dialog-image');
  // Delegation also handles cloned slides created by the original carousel.
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-video],[data-image]');
    if(!target)return;
    document.getElementById('dialog-title').textContent=target.dataset.title;
    dialog.showModal();
    document.dispatchEvent(new Event('pause-comparison'));
    document.querySelectorAll('main video').forEach(v=>{if(teaserVideos.includes(v))pauseAuto(v);else v.pause();});
    if(target.dataset.video){
      picture.hidden=true;player.hidden=false;
      player.src='assets/'+target.dataset.video+'.mp4';
      player.poster='assets/'+target.dataset.video+'.jpg';
      player.muted=true;player.loop=false;player.play().catch(()=>{});
    }else{
      player.hidden=true;picture.hidden=false;
      picture.src='assets/'+target.dataset.image;picture.alt=target.dataset.title;
    }
  });
  dialog.querySelector('.delete').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  const filters=[...document.querySelectorAll('[data-filter]')];
  const scenes=[...document.querySelectorAll('[data-environment]')];
  const previewVideos=[...document.querySelectorAll('.scene-preview video')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let previewsPaused=reduced.matches;
  const visible=new Set();
  const motion=document.getElementById('gallery-motion');
  const teaser=document.getElementById('teaser');
  const teaserVideos=[...document.querySelectorAll('.teaser-grid video')];
  const manualVideos=[...document.querySelectorAll('.runtime-clips video,.route-section video')];
  let comparisonPlaying=false,teaserPaused=false;
  const autoPauses=new WeakSet();
  const inViewport=v=>{const r=v.getBoundingClientRect();return r.width>0&&r.bottom>70&&r.top<innerHeight;};
  function pauseAuto(v){if(!v.paused){autoPauses.add(v);v.pause();}}
  function updatePreviews(){
    const busy=comparisonPlaying||manualVideos.some(v=>!v.paused&&!v.ended);
    const allowed=!document.hidden&&!dialog.open&&!busy;
    motion.textContent=previewsPaused?'Play previews':'Pause previews';motion.setAttribute('aria-pressed',String(previewsPaused));
    previewVideos.forEach(v=>{if(!previewsPaused&&allowed&&visible.has(v)&&inViewport(v)&&!v.closest('[data-environment]').hidden){v.muted=true;v.play().catch(()=>{});}else pauseAuto(v);});
    teaserVideos.forEach(v=>{if(!reduced.matches&&!teaserPaused&&allowed&&visible.has(v)&&inViewport(v)){v.muted=true;v.play().catch(()=>{});}else pauseAuto(v);});
  }
  teaserVideos.forEach(v=>{v.addEventListener('pause',()=>{if(autoPauses.has(v)){autoPauses.delete(v);return;}teaserPaused=true;updatePreviews();});v.addEventListener('play',()=>{teaserPaused=false;});});
  document.addEventListener('start-comparison',()=>{comparisonPlaying=true;manualVideos.forEach(v=>v.pause());updatePreviews();});
  document.addEventListener('stop-comparison',()=>{comparisonPlaying=false;updatePreviews();});
  manualVideos.forEach(v=>{
    v.addEventListener('play',()=>{manualVideos.forEach(other=>{if(other!==v)other.pause();});document.dispatchEvent(new Event('pause-comparison'));updatePreviews();});
    v.addEventListener('pause',()=>updatePreviews());
    v.addEventListener('ended',()=>updatePreviews());
  });
  const previewObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>=.15)visible.add(e.target);else visible.delete(e.target);});updatePreviews();},{threshold:.15,rootMargin:'-55px 0px 0px 0px'});
  previewVideos.forEach(v=>previewObserver.observe(v));
  teaserVideos.forEach(v=>previewObserver.observe(v));
  motion.addEventListener('click',()=>{previewsPaused=!previewsPaused;updatePreviews();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){manualVideos.forEach(v=>v.pause());player.pause();}updatePreviews();});
  dialog.addEventListener('close',updatePreviews);
  reduced.addEventListener('change',e=>{previewsPaused=e.matches;updatePreviews();});
  function filter(value){let count=0;scenes.forEach(s=>{s.hidden=value!=='all'&&s.dataset.environment!==value;if(!s.hidden)count++;s.querySelectorAll('video').forEach(v=>v.pause());});filters.forEach(b=>{const active=b.dataset.filter===value;b.setAttribute('aria-pressed',active);b.parentElement.classList.toggle('is-active',active);});document.getElementById('scene-count').textContent=count+' scenes';updatePreviews();}
  filters.forEach(b=>b.addEventListener('click',()=>filter(b.dataset.filter)));filter('all');
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause();}),{threshold:.05});
  manualVideos.forEach(v=>observer.observe(v));
})();
