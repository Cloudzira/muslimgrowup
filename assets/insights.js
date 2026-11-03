/* Muslim Grow Up - modul Command Center & Command Palette.
   Hanya membaca `state` dan memanggil fungsi inti yang sudah ada. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const dayKey=d=>getDateKey(d);
  const pct=(a,b)=>b?Math.round(a/b*100):0;

  function stats(){
    const today=new Date(), key=dayKey(today);
    const due=state.habits.filter(h=>isHabitScheduled(h,today));
    const done=due.filter(h=>h.history&&h.history[key]===true);
    let wDone=0,wDue=0; const cat={};
    for(let i=0;i<7;i++){
      const d=new Date(today); d.setDate(d.getDate()-i); const k=dayKey(d);
      state.habits.forEach(h=>{ if(!isHabitScheduled(h,d))return; wDue++;
        if(h.history&&h.history[k]===true){wDone++;cat[h.category]=(cat[h.category]||0)+1;} });
    }
    const best=Math.max(0,...state.habits.map(getHabitStreak));
    const top=Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];
    return {due,done,week:pct(wDone,wDue),best,top,pending:due.filter(h=>!done.includes(h))};
  }
  function insight(s){
    if(!state.habits.length) return 'Mulai dengan menambah kebiasaan atau memilih template agenda harian.';
    if(s.due.length&&!s.pending.length) return 'Alhamdulillah, semua agenda hari ini selesai. Jaga ritme, istirahat juga bagian dari tumbuh.';
    const n=s.pending[0]; const tail=n?` Berikutnya: <b>${escapeHtml(n.name)}</b>.`:'';
    if(s.week>=80) return `Konsistensi 7 hari sangat baik (${s.week}%).${tail}`;
    if(s.week>=50) return `Ritme mulai terbentuk (${s.week}%). Fokus selesaikan satu kebiasaan kecil dulu.${tail}`;
    return `Mulai pelan-pelan, satu langkah kecil lebih berharga dari rencana besar.${tail}`;
  }
  function render(){
    const host=$('#habitsTab'); if(!host) return;
    let el=$('#mgCC');
    if(!el){ el=document.createElement('section'); el.id='mgCC'; el.className='glass-panel mg-cc'; el.setAttribute('aria-label','Command Center'); host.prepend(el); }
    const s=stats(), p=pct(s.done.length,s.due.length), C=2*Math.PI*42;
    const cat=s.top&&CATEGORY_MAP[s.top[0]]?CATEGORY_MAP[s.top[0]].label:'-';
    el.innerHTML=`<div class="mg-ring"><svg viewBox="0 0 100 100"><defs><linearGradient id="mgGrad"><stop offset="0" stop-color="var(--mg-b)"/><stop offset="1" stop-color="var(--mg-a)"/></linearGradient></defs>
      <circle class="t" cx="50" cy="50" r="42" fill="none" stroke-width="8"/>
      <circle class="p" cx="50" cy="50" r="42" fill="none" stroke-width="8" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p/100)}"/></svg><b>${p}%</b></div>
      <div class="mg-kpis"><div class="mg-kpi"><small>Hari ini</small><strong>${s.done.length}/${s.due.length}</strong></div>
      <div class="mg-kpi"><small>7 hari</small><strong>${s.week}%</strong></div>
      <div class="mg-kpi"><small>Streak</small><strong>${s.best}h</strong></div></div>
      <div class="mg-insight">${insight(s)} <span style="opacity:.6">Dominan: ${cat}.</span></div>`;
  }
  /* Command palette */
  const cmds=window.MG_CMDS=[
    ['Buka Kebiasaan',()=>switchTab('habitsTab'),'1'],['Buka Statistik',()=>switchTab('statsTab'),'2'],['Buka Pencapaian',()=>switchTab('achievementsTab'),'3'],
    ['Tambah kebiasaan',()=>openHabitModal(),'N'],['Template agenda harian',()=>openHabitTemplateModal(),'T'],
    ['Alat fokus (stopwatch & timer)',()=>openFocusTools(),'F'],['Pengaturan',()=>openSettingsModal(),'S'],
    ['Tema gelap',()=>setTheme('dark')],['Tema terang',()=>setTheme('light')],['Tema feminin',()=>setTheme('feminine')],
    ['Ekspor cadangan JSON',()=>exportData(),'E']
  ];
  let sel=0,list=[];
  function paint(q=''){
    list=cmds.filter(c=>c[0].toLowerCase().includes(q.toLowerCase())); sel=0;
    $('#mgPalette ul').innerHTML=list.map((c,i)=>`<li data-i="${i}" class="${i?'':'on'}">${c[0]}<kbd>${c[2]||''}</kbd></li>`).join('')||'<li>Tidak ada perintah</li>';
  }
  function run(i){ const c=list[i]; if(!c)return; close(); c[1](); }
  function open(){ const p=$('#mgPalette'); p.classList.add('open'); const inp=$('input',p); inp.value=''; paint(); inp.focus(); }
  function close(){ $('#mgPalette').classList.remove('open'); }
  function mount(){
    const p=document.createElement('div'); p.id='mgPalette'; p.setAttribute('role','dialog'); p.setAttribute('aria-label','Palet perintah');
    p.innerHTML='<div class="box glass-panel"><input placeholder="Ketik perintah… (Ctrl+K)" aria-label="Cari perintah"><ul></ul></div>';
    document.body.appendChild(p);
    p.addEventListener('mousedown',e=>{ if(e.target===p)close(); const li=e.target.closest('li[data-i]'); if(li)run(+li.dataset.i); });
    $('input',p).addEventListener('input',e=>paint(e.target.value));
    $('input',p).addEventListener('keydown',e=>{
      const lis=[...p.querySelectorAll('li')];
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); sel=(sel+(e.key==='ArrowDown'?1:-1)+lis.length)%lis.length; lis.forEach((l,i)=>l.classList.toggle('on',i===sel)); }
      else if(e.key==='Enter')run(sel); else if(e.key==='Escape')close(); });
    const fab=document.createElement('button'); fab.id='mgFab'; fab.type='button'; fab.textContent='⌘'; fab.setAttribute('aria-label','Buka palet perintah'); fab.onclick=open; document.body.appendChild(fab);
    document.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); open(); } });
  }
  /* Sambungkan ke siklus render inti */
  const orig=window.renderAll;
  window.renderAll=function(){ orig.apply(this,arguments); try{render();}catch(e){console.warn('insights',e);} };
  mount(); try{render();}catch(e){}
})();
