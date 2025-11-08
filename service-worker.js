// Capital Pizza - Service Worker
const CACHE_NAME = "capital-pizza-cache-v1";
const urlsToCache = [
  "./index.html",
  "./icon.png"
];

// Instalacja service workera
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Obsługa żądań (offline support)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
