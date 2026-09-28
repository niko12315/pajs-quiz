const CACHE = 'theoryquiz-v1';
const PREFIX = 'theoryquiz-';   // 只清自己这科的旧缓存，别误删隔壁科目
const ASSETS = ['./', './index.html', './manifest.json',
                './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // 页面：先走网络(拿更新)，断网时用缓存兜底
    e.respondWith(fetch(req).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put('./index.html', cp));
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    const cp = res.clone();
    caches.open(CACHE).then(c => c.put(req, cp));
    return res;
  })));
});
