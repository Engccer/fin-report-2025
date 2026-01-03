// 장교조 재정 관리 앱 - Service Worker
const CACHE_NAME = 'janggyo-finance-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/utils/format.js',
  '/js/utils/keyboard.js',
  '/js/views/dashboard.js',
  '/js/views/monthly.js',
  '/js/views/budget.js',
  '/js/views/trends.js',
  '/js/views/planner.js',
  '/js/views/search.js',
  '/data/reports.json',
  '/data/budget.json'
];

// 설치 시 정적 자산 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 열림');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 시 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 우선, 실패 시 캐시 사용
self.addEventListener('fetch', (event) => {
  // Chart.js CDN은 네트워크에서만 가져옴
  if (event.request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 시 캐시 업데이트
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져옴
        return caches.match(event.request);
      })
  );
});
