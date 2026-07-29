const CACHE_NAME = "purin-pet-v10";
const APP_SHELL = [
  "./",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./purin-stages/child.png",
  "./purin-stages/teen.png",
  "./purin-stages/adult.png",
  "./purin-stages/middle.png",
  "./purin-stages/senior.png",
  "./purin-game/game-items.webp",
  "./purin-scenes/cozy.webp",
  "./purin-scenes/cafe.webp",
  "./purin-scenes/garden.webp",
  "./purin-scenes/camp.webp",
  "./purin-scenes/rainy.webp",
  "./purin-scenes/beach.webp",
  "./purin-scenes/moon.webp",
  "./purin-scenes/bakery.webp",
  "./purin-scenes/arcade.webp",
  "./purin-scenes/snow.webp",
  "./purin-scenes/puddingland.webp",
  "./purin-scenes/upside.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./", copy));
          return response;
        })
        .catch(() => caches.match("./")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok && new URL(event.request.url).origin === location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, copy),
            );
          }
          return response;
        }),
    ),
  );
});
