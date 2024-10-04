// On nomme le cache
const CACHE_NAME = "note-cache-j2";

// On liste les fichiers à mettre en cache
const urlsToCache = [
  "/",
  "/index.html",
  "/assets/css/styles.css",
  "/assets/js/app.js",
  "/assets/js/api.js",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  "/assets/icons/favicon.png",
  "/manifest.json",
];

// On installe le service worker
self.addEventListener("install", (event) => {
  // On attend que le cache soit ouvert
  event.waitUntil(
    // On ouvre le cache
    caches.open(CACHE_NAME).then((cache) => {
      // On ajoute les fichiers à mettre en cache
      return cache.addAll(urlsToCache);
    })
  );
});

// On active le service worker
self.addEventListener("fetch", (event) => {
  // On répond avec les fichiers mis en cache
  event.respondWith(
    caches
      // On ouvre le cache
      .match(event.request)
      // On retourne les fichiers mis en cache
      .then((response) => response || fetch(event.request))
      // On gère les erreurs
      .catch((error) => console.trace(error))
  );
});

// On vide les anciens caches
self.addEventListener("activate", (event) => {
  // On attend que le cache soit ouvert
  event.waitUntil(
    // On récupère les caches
    caches.keys().then((cacheNames) => {
      // On retourne une promesse
      return Promise.all(
        // On boucle sur les caches
        cacheNames.map((cacheName) => {
          // Si le cache est différent du cache actuel
          if (cacheName !== CACHE_NAME) {
            // On le supprime
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
