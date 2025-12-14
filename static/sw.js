self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("weather-app").then(cache => {
      return cache.addAll(["/", "/static/style.css", "/static/app.js"]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
