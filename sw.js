// Later 프로토타입: 홈 화면 앱으로 열 때 오프라인에서도 뜨게 하는 최소 캐시
// 화면(index)은 항상 네트워크 먼저 받아 최신판을 보여 주고, 끊겼을 때만 저장본을 씁니다.
const CACHE = 'later-v4'; // 배포할 때마다 숫자를 올린다
const ASSETS = ['./', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('later-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put('./', copy))); }
          return res;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
