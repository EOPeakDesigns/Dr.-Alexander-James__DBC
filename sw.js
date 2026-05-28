const CACHE_NAME = "dbc-gm-v16";
const SHELL_ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./script.js?v=2",
    "./data/card.json",
    "./manifest.webmanifest",
    "./assets/favicon.svg",
    "./assets/brand-mark.svg",
    "./assets/brand-mark-qr.svg",
    "./assets/favicon-16x16.png",
    "./assets/favicon-32x32.png",
    "./assets/favicon-192x192.png",
    "./assets/favicon-512x512.png",
    "./assets/apple-touch-icon.png",
    "./assets/Inversment_icon.png",
    "./assets/MYQR.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === "basic") {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || networkFetch;
        })
    );
});
