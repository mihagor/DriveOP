/* DriveOP presentation player. Plain JavaScript; works from file:// without a server. */
(() => {
  'use strict';
  const DATA = window.DRIVEOP_DATA;
  if (!DATA || !Array.isArray(DATA.slides) || DATA.slides.length !== 12) {
    document.body.innerHTML = '<p style="padding:40px">Manjka content.js ali podatki za 12 slajdov.</p>';
    return;
  }
  const $ = (id) => document.getElementById(id);
  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const slides = all('.slide');
  const fmt = (n, digits = 0) => new Intl.NumberFormat('sl-SI', {maximumFractionDigits: digits, useGrouping: 'always'}).format(n);
  const time = (s) => { const n = Math.max(0, Math.floor(Math.abs(s))); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const starts = DATA.slides.map((_, i) => DATA.slides.slice(0,i).reduce((n,s) => n+s.duration,0));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0, previousIndex = -1, toastTimeout, presenterWindow = null;
  let clockElapsed = 0, clockRunning = false, automatic = false;
  let demoStep = 0, demoAutomatic = true, demoPaused = reducedMotion, demoElapsed = 0;
  let infoResume = false, zoomResume = false, lastFrame = performance.now(), lastUITick = 0;
  const media = {
    taste: 'assets/taste.webp',
    know: 'assets/know.mp4',
    match: 'assets/match.mp4',
    knowPoster: 'assets/know-poster.webp',
    matchPoster: 'assets/match-poster.webp'
  };
  const steps = [
    {title:'Pokaži, kaj ti je všeč.', description:'Izbire avtomobilov razkrijejo tvoj okus.', label:'TASTE - statični zaslon', duration:6},
    {title:'Povej, kako zares živiš.', description:'Kilometri, potrebe, prioritete in finančni okvir.', label:'KNOW - posnetek prototipa', duration:20},
    {title:'Razumi, zakaj ti avto ustreza.', description:'Različne smeri izbire, razlogi in prikaz stroškov.', label:'MATCH - posnetek prototipa', duration:16}
  ];
  const model = DATA.model;
  const years = model.years.map(y => ({...y, accepted_leads:y.average_partners*y.leads_per_partner_month*12,
    revenue:y.average_partners*y.leads_per_partner_month*12*model.price_per_accepted_lead}));
  const values = {
    'price':fmt(model.price_per_accepted_lead), 'variable-cost':fmt(model.target_variable_cost_per_lead),
    'contribution':fmt(model.price_per_accepted_lead-model.target_variable_cost_per_lead),
    'tam-millions':fmt(Math.round(model.eu_new_car_registrations_2025*model.price_per_accepted_lead/1e6)),
    'sam-millions':fmt(model.si_new_ordinary_car_registrations_2025*model.price_per_accepted_lead/1e6,2),
    'si-market':fmt(model.si_new_ordinary_car_registrations_2025),'ask':fmt(model.ask)
  };
  years.forEach((y,i) => {
    values[`year${i+1}-leads`] = fmt(y.accepted_leads);
    values[`year${i+1}-revenue`] = fmt(y.revenue);
    values[`year${i+1}-revenue-short`] = fmt(y.revenue/1000,1)+'k';
    values[`year${i+1}-partners`] = fmt(y.average_partners);
    values[`year${i+1}-monthly`] = fmt(y.leads_per_partner_month);
    values[`year${i+1}-formula`] = `${y.average_partners} \u00d7 ${y.leads_per_partner_month} \u00d7 12`;
  });
  model.fund_allocation.forEach((v,i) => { values[`fund${i}`] = fmt(v); });
  all('[data-bind]').forEach(el => { if (Object.hasOwn(values, el.dataset.bind)) el.textContent = values[el.dataset.bind]; });
  const chartMax = Math.max(100000,Math.ceil(Math.max(...years.map(y=>y.revenue))/100000)*100000);
  all('[data-bar]').forEach(el => el.style.setProperty('--bar-h',`${259*years[Number(el.dataset.bar)].revenue/chartMax}px`));
  all('.chart-grid span').forEach((el,i) => el.textContent = i === 3 ? '0' : fmt(chartMax*(3-i)/3/1000,1)+'k');
  all('.allocation-bar i').forEach((el,i) => el.style.width = (100*model.fund_allocation[i]/model.ask)+'%');
  document.querySelector('.revenue-chart').setAttribute('aria-label', 'Modelni letni prihodki: '+years.map((y,i)=>`leto ${i+1}: ${fmt(y.revenue)} EUR`).join('; '));

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(()=>$('toast').classList.remove('visible'), 3400);
  }
  function resize() {
    const box=$('viewport').getBoundingClientRect();
    const scale=Math.max(.1,Math.min(box.width/1600,box.height/900));
    $('stage').style.transform = `scale(${scale})`;
  }
  function updateNotes() {
    const s = DATA.slides[index];
    $('notes-title').textContent = `${String(index+1).padStart(2,'0')} / ${s.title}`;
    $('notes-time').textContent = `${time(starts[index])} - ${time(starts[index]+s.duration)} | ${s.duration} sekund`;
    $('notes-script').textContent = s.script;
    $('notes-cue').textContent = s.cue;
    updatePresenter();
  }
  function go(n, setHash=true) {
    n=Math.max(0,Math.min(slides.length-1,Number(n)||0));
    const changed=index!==n || previousIndex===-1;
    if (!changed) return;
    previousIndex=index; index=n;
    slides.forEach((el,i) => {el.classList.toggle('active',i===index);el.setAttribute('aria-hidden',String(i!==index));el.inert=i!==index;});
    $('stage').classList.toggle('is-light',slides[index].classList.contains('light'));
    $('chapter').textContent = `${String(index+1).padStart(2,'0')} / ${DATA.slides[index].title}`;
    $('slide-number').textContent = `${String(index+1).padStart(2,'0')} / 12`;
    $('slide-time').textContent = `${time(starts[index])} - ${time(starts[index]+DATA.slides[index].duration)}`;
    $('nav-title').textContent=DATA.slides[index].title;
    $('prev').disabled=index===0; $('next').disabled=index===slides.length-1;
    all('.slide-dots button').forEach((el,i)=>{el.classList.toggle('selected',i===index);el.setAttribute('aria-current',i===index?'step':'false');});
    $('overall-progress').style.width=(100*(index+1)/slides.length)+'%';
    $('slide-announcement').textContent=`Slajd ${index+1} od 12. ${DATA.slides[index].title}. ${DATA.slides[index].headline}`;
    if(setHash) { try {history.replaceState(null,'',`#${index+1}`);} catch (_) {location.hash=String(index+1);} }
    if(index===2) resetDemo(); else {$('demo-video').pause();}
    updateNotes();
  }
  const next=()=>go(index+1), prev=()=>go(index-1);
  DATA.slides.forEach((s,i)=>{
    const button=document.createElement('button');
    button.type='button';button.title=`${i+1}. ${s.title} (${s.duration} s)`;button.setAttribute('aria-label',button.title);
    button.addEventListener('click',()=>go(i));$('slide-dots').appendChild(button);
  });
  function safePlay(video, fallback) {
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => { if(fallback) $('demo-play-fallback').hidden=false; });
  }
  function setDemoStep(n, fromAutomatic=false) {
    demoStep=Math.max(0,Math.min(2,n));
    if(!fromAutomatic) {demoAutomatic=false;demoElapsed=0;}
    const step=steps[demoStep], video=$('demo-video'), still=$('demo-still');
    all('.demo-tab').forEach((el,i)=>{el.classList.toggle('selected',i===demoStep);el.setAttribute('aria-selected',String(i===demoStep));el.tabIndex=i===demoStep?0:-1;});
    $('demo-visual').setAttribute('aria-labelledby',`tab${demoStep}`);
    $('demo-explanation').innerHTML=`<h3>${escapeHTML(step.title)}</h3><p>${escapeHTML(step.description)}</p>`;
    $('demo-media-label').textContent=step.label;
    $('demo-play-fallback').hidden=true;
    if(demoStep===0) {video.pause();video.style.display='none';still.style.display='block';still.src=media.taste;}
    else {
      const path = demoStep===1?media.know:media.match;
      const poster = demoStep===1?media.knowPoster:media.matchPoster;
      video.poster=poster;still.src=poster;still.style.display='none';video.style.display='block';
      if(video.dataset.current!==path) {video.src=path;video.dataset.current=path;video.load();}
      else {try {video.currentTime=0;} catch (_) {}}
      if(!demoPaused && index===2) safePlay(video,true);
    }
    $('demo-pause').textContent=demoPaused?'Nadaljuj demo':'Ustavi demo';
  }
  function resetDemo() {demoElapsed=0;demoAutomatic=true;demoPaused=reducedMotion;setDemoStep(0,true);}
  function toggleDemoPause() {
    demoPaused=!demoPaused;
    if(demoPaused) $('demo-video').pause();
    else if(demoStep>0) safePlay($('demo-video'),true);
    $('demo-pause').textContent=demoPaused?'Nadaljuj demo':'Ustavi demo';
  }
  all('[data-step]').forEach(button=>button.addEventListener('click',()=>setDemoStep(Number(button.dataset.step))));
  $('demo-pause').addEventListener('click',toggleDemoPause);
  $('demo-replay').addEventListener('click',resetDemo);
  $('demo-play-fallback').querySelector('button').addEventListener('click',()=>{$('demo-play-fallback').hidden=true;safePlay($('demo-video'),true);});
  $('demo-video').addEventListener('error',()=>{
    $('demo-video').style.display='none';$('demo-still').style.display='block';
    $('demo-media-label').textContent='Posnetek ni na voljo - rezervni statični zaslon';
    toast('Predvajanje ni uspelo. Prikazan je rezervni zaslon.');
  });
  $('demo-video').addEventListener('loadeddata',()=>{if(index===2&&demoStep>0&&!demoPaused&&!$('demo-dialog').open)safePlay($('demo-video'),true);});
  function zoomStep(n) {
    const s=steps[n],video=$('zoom-video'),image=$('zoom-still');
    $('zoom-copy').textContent=s.title;$('zoom-description').textContent=s.description;
    $('zoom-title').textContent=['TASTE','KNOW','MATCH'][n];
    all('[data-zoom-step]').forEach(el=>el.classList.toggle('selected',Number(el.dataset.zoomStep)===n));
    if(n===0){video.pause();video.style.display='none';image.style.display='block';image.src=media.taste;}
    else{image.style.display='none';video.style.display='block';video.poster=n===1?media.knowPoster:media.matchPoster;video.src=n===1?media.know:media.match;video.load();safePlay(video,false);}
  }
  function openDemo() {
    if(index!==2)go(2);
    zoomResume=!demoPaused;demoPaused=true;$('demo-video').pause();
    $('demo-dialog').showModal();zoomStep(demoStep);
  }
  $('demo-expand').addEventListener('click',openDemo);
  all('[data-zoom-step]').forEach(el=>el.addEventListener('click',()=>zoomStep(Number(el.dataset.zoomStep))));
  $('demo-dialog').addEventListener('close',()=>{
    $('zoom-video').pause();demoPaused=!zoomResume;
    if(!demoPaused&&demoStep>0&&index===2)safePlay($('demo-video'),true);
    $('demo-pause').textContent=demoPaused?'Nadaljuj demo':'Ustavi demo';
  });
  $('zoom-video').addEventListener('error',()=>{const img=$('zoom-still');img.src=$('zoom-video').poster;img.style.display='block';$('zoom-video').style.display='none';toast('Prikazan je rezervni statični zaslon.');});

  function toggleClock() {
    clockRunning=!clockRunning;
    if(clockRunning) toast(automatic?'Samodejna 5-minutna vaja teče.':'Štoparica teče. Slajde menjaj ročno.');
    updateClock();
  }
  function resetClock() {clockElapsed=0;clockRunning=false;automatic=false;document.body.classList.remove('auto-running');updateClock();toast('Vaja ponastavljena na 5:00.');}
  function toggleAutomatic() {
    automatic=!automatic;document.body.classList.toggle('auto-running',automatic);
    if(automatic){clockElapsed=0;clockRunning=true;go(0);toast('Samodejna vaja: vseh 12 slajdov v 5 minutah. A izklopi.');}
    else toast('Samodejni prehodi so izklopljeni.');
    updateClock();
  }
  function updateClock() {
    const remaining=DATA.duration-clockElapsed;
    $('timer-value').textContent=(remaining<0?'+':'')+time(remaining);
    $('timer-toggle').classList.toggle('running',clockRunning);
    $('timer-toggle').classList.toggle('over',remaining<0);
    $('timer-label').textContent=clockRunning?(automatic?'Samodejno':'Premor'):(clockElapsed===0?'Začni vajo':'Nadaljuj');
    updatePresenter();
  }
  function toggleNotes(force) {
    $('notes-drawer').hidden=typeof force==='boolean'?!force:!$('notes-drawer').hidden;
    $('notes-toggle').setAttribute('aria-expanded',String(!$('notes-drawer').hidden));
  }
  function openInfo(title,content,eyebrow='VIRI IN PREDPOSTAVKE') {
    $('info-title').textContent=title;$('info-eyebrow').textContent=eyebrow;
    $('info-content').innerHTML=content;infoResume=index===2&&!demoPaused;$('demo-video').pause();$('info-dialog').showModal();
  }
  function showSources() {
    const s=DATA.slides[index];
    const sourceHTML=s.sources.map(id=>{
      const source=DATA.sources.find(x=>x.id===id);if(!source)return '';
      return `<div class="source-card">${source.url?`<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.title)} &#8599;</a>`:`<strong>${escapeHTML(source.title)}</strong>`}<p>${escapeHTML(source.detail)}</p></div>`;
    }).join('');
    openInfo(`${index+1}. ${s.title}`,`<h3>Status trditve</h3><p>${escapeHTML(s.status)}</p><h3>Kaj je dokazano in kaj ne</h3><p>${escapeHTML(s.evidence)}</p><h3>Podlage</h3>${sourceHTML}`);
  }
  function showHelp() {
    const keys=[['\u2190 / \u2192','Prejšnji / naslednji slajd'],['Space','Naslednji slajd'],['F','Celozaslonski prikaz'],['P','Ločeno govorniško okno'],['N','Opombe na tem zaslonu'],['S','Viri in predpostavke'],['T','Začni / ustavi štoparico'],['Shift T','Ponastavi štoparico'],['A','Samodejna 5-minutna vaja'],['1 / 2 / 3','Korak dema na slajdu 3'],['R','Začni demo znova'],['D','Povečan demo'],['O','Pregled vseh slajdov'],['H','Skrij / pokaži orodja'],['Home / End','Prvi / zadnji slajd'],['Esc','Zapri pogovorno okno']];
    openInfo('Oder, vaja in demonstracija',`<p>Predstavitev deluje brez interneta. Na odru uporabi ročne prehode; avtomatska vaja je za preverjanje tempa. Demo se na tretjem slajdu zažene sam, posnetka sta brez zvoka.</p><div class="help-grid">${keys.map(([key,label])=>`<div><kbd>${escapeHTML(key)}</kbd>${escapeHTML(label)}</div>`).join('')}</div><h3>Pred projekcijo</h3><p>Odpri govorniško okno s P, premakni ga na svoj zaslon in projiciraj le glavno okno. Vsebina prikazuje prototip; demo ni dejanska aplikacija. Zneske, cilje in biografiji potrdi pred natečajem.</p>`,'NAVODILA');
  }
  function overview() {
    openInfo('12 slajdov. 5 minut.',`<div class="overview-grid">${DATA.slides.map((s,i)=>`<button type="button" data-jump="${i}"><span>${String(i+1).padStart(2,'0')} / ${s.duration} s</span><b>${escapeHTML(s.title)}</b></button>`).join('')}</div>`,'PREGLED PREDSTAVITVE');
    all('[data-jump]').forEach(el=>el.addEventListener('click',()=>{$('info-dialog').close();go(Number(el.dataset.jump));}));
  }
  async function fullscreen() {
    try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch (_) {toast('Celozaslonski prikaz ni dovoljen. Uporabi celozaslonski način brskalnika.');}
  }
  function openPresenter() {
    if(presenterWindow&&!presenterWindow.closed){presenterWindow.focus();return;}
    presenterWindow=window.open('','DriveOPGovornik','popup=yes,width=1060,height=850');
    if(!presenterWindow){toast('Brskalnik je blokiral novo okno. Dovoli pojavno okno ali uporabi N.');return;}
    presenterWindow.document.open();
    presenterWindow.document.write(`<!doctype html><html lang="sl"><head><meta charset="utf-8"><title>DriveOP - govornik</title><style>*{box-sizing:border-box}body{margin:0;background:#0b1727;color:#ecf3ff;font-family:system-ui,sans-serif;padding:32px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #38516d;padding-bottom:20px;margin-bottom:24px}h1{font-size:27px;margin:0;letter-spacing:-.7px}small{font-size:12px;letter-spacing:1px;color:#85a1c1}.grid{display:grid;grid-template-columns:1fr 240px;gap:32px}#pscript{font-size:27px;line-height:1.5;margin:22px 0;white-space:pre-wrap}#pcue{font-size:15px;line-height:1.6;color:#9fb8d4;border-top:1px solid #334e6e;padding-top:20px}#pclock{font-size:65px;letter-spacing:-3px;color:#4ee1cf;font-variant-numeric:tabular-nums}#prange{font-size:14px;color:#4ee1cf;margin-top:10px}#pstatus{font-size:12px;color:#7f9bbd;margin-top:9px}#pnexttitle{font-size:20px;line-height:1.3;margin-top:15px}#pnextcopy{font-size:14px;line-height:1.5;color:#7996b8;margin-top:12px}.buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:25px}button{font:inherit;font-size:14px;background:#142b44;border:1px solid #48627e;border-radius:7px;color:#dbeaff;cursor:pointer;padding:10px 13px}button:hover{background:#23425e}.notice{font-size:12px;color:#728bab;line-height:1.5;margin-top:26px}.next{margin-top:32px;border-top:1px solid #38516d;padding-top:25px}</style></head><body><header><div><small>DRIVEOP / LOČENO GOVORNIŠKO OKNO</small><h1 id="ptitle"></h1></div><small id="pfraction"></small></header><div class="grid"><main><div id="prange"></div><p id="pscript"></p><p id="pcue"></p></main><aside><small>DO KONCA PITCHA</small><div id="pclock">5:00</div><div id="pstatus"></div><div class="buttons"><button id="pprev">&larr; Nazaj</button><button id="pnext">Naprej &rarr;</button><button id="ptimer">Vaja / premor</button><button id="preset">Ponastavi</button><button id="pdemo">Demo</button></div><div class="next"><small>NASLEDNJI SLAJD</small><div id="pnexttitle"></div><p id="pnextcopy"></p></div><p class="notice">Projiciraj samo glavno okno. To okno vsebuje govor in opozorila. Zneski in cilji z oznako predlog niso potrjena dejstva.</p></aside></div></body></html>`);
    presenterWindow.document.close();
    const d=presenterWindow.document;
    d.getElementById('pprev').onclick=prev;d.getElementById('pnext').onclick=next;
    d.getElementById('ptimer').onclick=toggleClock;d.getElementById('preset').onclick=resetClock;
    d.getElementById('pdemo').onclick=()=>go(2);
    presenterWindow.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key===' '){event.preventDefault();next();}if(event.key==='ArrowLeft'){event.preventDefault();prev();}if(event.key.toLowerCase()==='t')toggleClock();});
    updatePresenter();
  }
  function updatePresenter() {
    if(!presenterWindow||presenterWindow.closed)return;
    try{
      const d=presenterWindow.document,s=DATA.slides[index],remaining=DATA.duration-clockElapsed;
      d.getElementById('ptitle').textContent=s.title;d.getElementById('pfraction').textContent=`${index+1} / 12`;
      d.getElementById('prange').textContent=`${time(starts[index])} - ${time(starts[index]+s.duration)} | ${s.duration} sekund`;
      d.getElementById('pscript').textContent=s.script;d.getElementById('pcue').textContent=s.cue;
      d.getElementById('pclock').textContent=(remaining<0?'+':'')+time(remaining);
      d.getElementById('pclock').style.color=remaining<0?'#f1a078':'#4ee1cf';
      d.getElementById('pstatus').textContent=clockRunning?(automatic?'Samodejna vaja teče':'Štoparica teče'):'Štoparica miruje';
      d.getElementById('pnexttitle').textContent=DATA.slides[index+1]?.title||'Zaključek / vprašanja komisije';
      d.getElementById('pnextcopy').textContent=DATA.slides[index+1]?.headline||'O je pregled slajdov. D odpre povečano demonstracijo.';
    }catch(_){/* A manually navigated or closed presenter window must not stop the deck. */}
  }

  $('info-dialog').addEventListener('close',()=>{if(infoResume&&index===2&&demoStep>0&&!demoPaused)safePlay($('demo-video'),true);infoResume=false;});
  $('next').addEventListener('click',next);$('prev').addEventListener('click',prev);
  $('timer-toggle').addEventListener('click',toggleClock);
  $('notes-toggle').addEventListener('click',()=>toggleNotes());$('notes-close').addEventListener('click',()=>toggleNotes(false));
  $('sources-toggle').addEventListener('click',showSources);$('help-toggle').addEventListener('click',showHelp);
  $('fullscreen').addEventListener('click',fullscreen);$('presenter-open').addEventListener('click',openPresenter);
  all('.dialog-close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  all('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input, textarea, select, [contenteditable="true"]'))return;
    if($('info-dialog').open||$('demo-dialog').open)return;
    const key=event.key.toLowerCase();
    if(key==='arrowright'||key==='pagedown'||key===' '){event.preventDefault();next();}
    else if(key==='arrowleft'||key==='pageup'){event.preventDefault();prev();}
    else if(key==='home'){event.preventDefault();go(0);}else if(key==='end'){event.preventDefault();go(11);}
    else if(key==='f')fullscreen();else if(key==='n')toggleNotes();else if(key==='s')showSources();else if(key==='p')openPresenter();
    else if(key==='t'){if(event.shiftKey)resetClock();else toggleClock();}else if(key==='a')toggleAutomatic();
    else if(key==='o')overview();else if(key==='?'||key==='f1'){event.preventDefault();showHelp();}
    else if(key==='h'){document.body.classList.toggle('chrome-hidden');resize();}
    else if(key==='d')openDemo();else if(key==='r'&&index===2)resetDemo();
    else if(['1','2','3'].includes(key)&&index===2)setDemoStep(Number(key)-1);
    else if(key==='escape')toggleNotes(false);
  });
  let touchStart=null;
  $('stage').addEventListener('touchstart',e=>{if(e.touches.length===1&&!e.target.closest('button,video,a'))touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  $('stage').addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dy)<55){if(dx<0)next();else prev();}},{passive:true});
  window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);
  window.addEventListener('hashchange',()=>{const n=parseInt(location.hash.slice(1),10);if(Number.isFinite(n))go(n-1,false);});
  document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();});
  function frame(now) {
    const delta=Math.max(0,Math.min((now-lastFrame)/1000,.25));lastFrame=now;
    const modal=$('info-dialog').open||$('demo-dialog').open;
    if(!document.hidden&&!modal){
      if(clockRunning){
        clockElapsed+=delta;
        if(automatic){
          const target=Math.min(11,starts.findIndex((t,i)=>clockElapsed>=t&&clockElapsed<t+DATA.slides[i].duration));
          if(target>=0&&target!==index)go(target);
          if(clockElapsed>=DATA.duration){clockElapsed=DATA.duration;clockRunning=false;automatic=false;document.body.classList.remove('auto-running');go(11);toast('Petminutna vaja je zaključena.');}
        }
      }
      if(index===2&&!demoPaused){
        demoElapsed+=delta;
        if(demoAutomatic){const phase=Math.min(demoElapsed,42);const step=phase<6?0:phase<26?1:2;if(step!==demoStep)setDemoStep(step,true);$('demo-progress').style.width=(100*phase/42)+'%';}
        else{$('demo-progress').style.width=(100*(demoElapsed%steps[demoStep].duration)/steps[demoStep].duration)+'%';}
      }
    }
    if(now-lastUITick>150){updateClock();lastUITick=now;}
    requestAnimationFrame(frame);
  }
  // Small public API is useful for embedding this HTML and for repeatable quality checks.
  window.DriveOP = {
    go,next,prev,resetDemo,setDemoStep,toggleDemoPause,openDemo,showSources,openPresenter,resetClock,toggleClock,
    getState:()=>({index,demoStep,demoAutomatic,demoPaused,demoElapsed,clockElapsed,clockRunning,automatic}),
    data:DATA
  };
  resize();go((parseInt(location.hash.slice(1),10)||1)-1);updateClock();requestAnimationFrame(frame);
})();
