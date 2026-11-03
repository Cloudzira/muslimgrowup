const VERSION = 'v6';
const SHELL_CACHE = `muslim-grow-up-shell-${VERSION}`;
const RUNTIME_CACHE = `muslim-grow-up-runtime-${VERSION}`;
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./firestore.rules','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/futuristic.css','./assets/palette.css','./assets/insights.js','./assets/firebase-config.js','./assets/cloud.js'];
// Dependensi CDN: di-cache saat install agar app jalan penuh offline.
const CDN = ['https://cdn.tailwindcss.com','https://unpkg.com/lucide@latest','https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js','https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap'];
const CDN_HOSTS = ['cdn.tailwindcss.com','unpkg.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com','www.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(APP_SHELL);
    const rt = await caches.open(RUNTIME_CACHE);
    await Promise.all(CDN.map(u => fetch(new Request(u, { mode: 'no-cors' })).then(r => rt.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![SHELL_CACHE, RUNTIME_CACHE].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(cache => cache.match(request).then(cached => {
    const network = fetch(request).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE).then(r => r || caches.match('./index.html')).catch(() => caches.match('./index.html')));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE).then(r => r || Response.error()));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => 'focus' in c);
    return open ? open.focus() : self.clients.openWindow('./index.html');
  }));
});
