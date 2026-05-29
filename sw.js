<<<<<<< HEAD
const CACHE_NAME = 'trading-journal-v2';
=======
const CACHE_NAME = 'trading-journal-v1';
>>>>>>> 0a836036ad05af6cfb41df9103b8ea508ea51107
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script.js',
  '/auth.js',
  '/style.css',
  '/manifest.json',
<<<<<<< HEAD
  '/icons/icon-192.png',
  '/icons/icon-512.png'
=======
  '/icons/icon.jpeg'
>>>>>>> 0a836036ad05af6cfb41df9103b8ea508ea51107
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});