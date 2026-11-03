/* Muslim Grow Up - Layanan: sinkron Firebase (Google login + Firestore), pengingat, status offline.
   Tanpa konfigurasi Firebase, modul ini hanya menjalankan pengingat & indikator offline. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), SDK='https://www.gstatic.com/firebasejs/10.12.2/firebase-';
  const cfg=window.MG_FIREBASE_CONFIG||{}, hasCfg=!!(cfg.apiKey&&cfg.projectId);
  let auth,db,user=null,unsub=null,pushT=null,status=hasCfg?'Belum masuk':'Firebase belum dikonfigurasi';
  const defRem={on:false,morning:'05:00',evening:'20:00'};
  const rem=()=>state.reminders=Object.assign({},defRem,state.reminders||{});

  /* ---------- Sinkronisasi ---------- */
  const origSave=window.saveState;
  window.saveState=function(){ state.updatedAt=Date.now(); origSave(); schedulePush(); };
  function load(src){ return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);}); }
  async function initFirebase(){
    if(!hasCfg||auth) return;
    try{
      for(const m of ['app','auth','firestore']) await load(`${SDK}${m}-compat.js`);
      firebase.initializeApp(cfg); auth=firebase.auth(); db=firebase.firestore();
      db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
      auth.onAuthStateChanged(u=>{ user=u; if(unsub){unsub();unsub=null;} if(u)listen(); setStatus(u?`Tersinkron: ${u.email}`:'Belum masuk'); });
    }catch(e){ setStatus('Gagal memuat Firebase (periksa koneksi)'); }
  }
  function listen(){
    const ref=db.collection('growup').doc(user.uid);
    unsub=ref.onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites) return;
      if(!snap.exists){ push(); return; }
      const r=snap.data(), local=state.updatedAt||0;
      if(r.updatedAt>local){ try{ Object.assign(state,JSON.parse(r.data)); origSave(); if(window.applyTheme)applyTheme(state.theme); renderAll(); setStatus('Data diperbarui dari cloud'); }catch(e){} }
      else if(r.updatedAt<local) push();
    },()=>setStatus('Sinkron tertunda (offline)'));
  }
  function schedulePush(){ if(!user)return; clearTimeout(pushT); pushT=setTimeout(push,2000); }
  function push(){ if(!user||!db)return; db.collection('growup').doc(user.uid).set({data:JSON.stringify(state),updatedAt:state.updatedAt||Date.now()}).then(()=>setStatus(`Tersinkron: ${user.email}`)).catch(()=>setStatus('Sinkron tertunda (offline)')); }
  async function login(){ await initFirebase(); if(!auth)return;
    const p=new firebase.auth.GoogleAuthProvider();
    try{ await auth.signInWithPopup(p); }catch(e){ if(e.code==='auth/popup-blocked')auth.signInWithRedirect(p); else setStatus('Login gagal: '+(e.code||'')); } }

  /* ---------- Pengingat ---------- */
  async function notify(title,body,tag){
    const opt={body,tag,icon:'./assets/icon-192.png',badge:'./assets/icon-192.png',lang:'id'};
    try{ const reg=await navigator.serviceWorker.ready; await reg.showNotification(title,opt); }
    catch(e){ if(window.Notification&&Notification.permission==='granted')new Notification(title,opt); }
  }
  async function enableRem(on){
    if(on){ if(!window.Notification){alert('Browser tidak mendukung notifikasi.');return false;}
      if(Notification.permission!=='granted'&&await Notification.requestPermission()!=='granted'){alert('Izin notifikasi ditolak.');return false;} }
    rem().on=on; saveState(); return true;
  }
  function tick(){
    if(!window.Notification||Notification.permission!=='granted'||!rem().on) return;
    const n=new Date(), cur=n.getHours()*60+n.getMinutes(), day=getTodayKey();
    const fired=JSON.parse(localStorage.getItem('mg_fired')||'{}');
    [['morning','Selamat pagi','Mulai harimu dengan kebiasaan baik pertama.'],['evening','Pengingat sore','']].forEach(([k,t,msg])=>{
      const [h,m]=rem()[k].split(':').map(Number), at=h*60+m;
      if(cur>=at&&cur<at+120&&fired[k]!==day){
        const due=state.habits.filter(x=>isHabitScheduled(x,n)), left=due.filter(x=>!(x.history&&x.history[day]===true)).length;
        if(k==='evening'&&!left){fired[k]=day;return;}
        fired[k]=day; notify(t,k==='evening'?`${left} kebiasaan hari ini belum selesai. Satu langkah kecil tetap berarti.`:msg,'mg-'+k);
      }
    });
    localStorage.setItem('mg_fired',JSON.stringify(fired));
  }
  setInterval(tick,30000); document.addEventListener('visibilitychange',tick); setTimeout(tick,3000);

  /* ---------- Panel ---------- */
  function setStatus(t){ status=t; const e=$('#mgStatus'); if(e)e.textContent=t; }
  function panel(){
    let p=$('#mgCloud');
    if(!p){ p=document.createElement('div'); p.id='mgCloud'; p.style.cssText='position:fixed;inset:0;z-index:110;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(5,10,8,.6);backdrop-filter:blur(6px)';
      p.addEventListener('mousedown',e=>{if(e.target===p)p.style.display='none';}); document.body.appendChild(p); }
    const r=rem(), online=navigator.onLine, notif=window.Notification?Notification.permission:'tidak didukung';
    p.innerHTML=`<div class="glass-panel" style="width:100%;max-width:440px;border-radius:18px;padding:20px;max-height:90vh;overflow:auto">
     <h2 style="font:600 17px Inter">Sinkron, Notifikasi & Offline</h2>
     <p style="font-size:12px;opacity:.7;margin:4px 0 14px">Koneksi: <b>${online?'Online':'Offline (data tetap tersimpan lokal)'}</b></p>
     <h3 style="font-weight:600;font-size:13px">Cloud (Firebase)</h3>
     <p id="mgStatus" style="font-size:12px;opacity:.8;margin:4px 0 8px">${status}</p>
     <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
       <button class="glass-card" id="mgLogin" style="padding:8px 12px;border-radius:10px;font-size:13px" ${hasCfg?'':'disabled'}>${user?'Sinkron sekarang':'Masuk dengan Google'}</button>
       ${user?'<button class="glass-card" id="mgLogout" style="padding:8px 12px;border-radius:10px;font-size:13px">Keluar</button>':''}</div>
     <h3 style="font-weight:600;font-size:13px">Pengingat harian</h3>
     <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:8px 0"><input type="checkbox" id="mgRem" ${r.on?'checked':''}> Aktifkan (izin: ${notif})</label>
     <div style="display:flex;gap:10px;font-size:12px;margin-bottom:8px"><label>Pagi <input type="time" id="mgMor" value="${r.morning}" style="background:transparent;border:1px solid rgba(127,150,140,.4);border-radius:8px;padding:4px"></label>
     <label>Sore <input type="time" id="mgEve" value="${r.evening}" style="background:transparent;border:1px solid rgba(127,150,140,.4);border-radius:8px;padding:4px"></label></div>
     <button class="glass-card" id="mgTest" style="padding:8px 12px;border-radius:10px;font-size:13px">Uji notifikasi</button>
     <p style="font-size:11px;opacity:.6;margin-top:12px">Pengingat berjalan saat app terbuka atau terpasang; pengingat yang terlewat dalam 2 jam akan muncul saat app dibuka. Push saat app tertutup butuh server (FCM).</p></div>`;
    p.style.display='flex';
    $('#mgLogin').onclick=async()=>{ if(user){push();}else await login(); };
    const lo=$('#mgLogout'); if(lo)lo.onclick=()=>auth.signOut();
    $('#mgRem').onchange=async e=>{ if(!await enableRem(e.target.checked)) e.target.checked=false; };
    $('#mgMor').onchange=e=>{rem().morning=e.target.value;saveState();};
    $('#mgEve').onchange=e=>{rem().evening=e.target.value;saveState();};
    $('#mgTest').onclick=async()=>{ if(!window.Notification)return; if(Notification.permission!=='granted'&&await Notification.requestPermission()!=='granted')return; notify('Muslim Grow Up','Notifikasi berfungsi dengan baik.','mg-test'); };
  }
  const fab=document.createElement('button'); fab.type='button'; fab.id='mgCloudFab'; fab.textContent='☁'; fab.setAttribute('aria-label','Sinkron, notifikasi & offline');
  fab.style.cssText='position:fixed;right:16px;bottom:72px;z-index:60;width:48px;height:48px;border-radius:50%;border:1px solid var(--mg-a);background:rgba(16,24,21,.85);color:var(--mg-a);font-size:20px;box-shadow:0 0 18px -2px var(--mg-a)';
  fab.onclick=panel; document.body.appendChild(fab);
  if(window.MG_CMDS) window.MG_CMDS.push(['Sinkron, notifikasi & offline',panel,'C']);
  const dot=()=>{fab.style.opacity=navigator.onLine?1:.55; fab.style.borderStyle=navigator.onLine?'solid':'dashed';};
  addEventListener('online',()=>{dot();initFirebase();}); addEventListener('offline',dot); dot();
  if(hasCfg&&navigator.onLine) initFirebase();
})();
