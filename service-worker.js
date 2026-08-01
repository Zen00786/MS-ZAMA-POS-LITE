const CACHE_NAME = "ms-zama-pos-lite-v5";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/style.css",
    "./css/layout.css",
    "./css/components.css",
    "./css/pages.css",
    "./css/print-a4.css",
    "./css/print-58.css",
    "./css/print-80.css",
    "./js/db.js",
    "./js/ui.js",
    "./js/products.js",
    "./js/billing.js",
    "./js/history.js",
    "./js/reports.js",
    "./js/settings.js",
    "./js/app.js",
    "./assets/icons/zpos-icon.svg",
    "./assets/ms-zama-logo.png"
];

self.addEventListener("install", function(event){

    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache){

            return cache.addAll(APP_SHELL);

        })
    );

    self.skipWaiting();

});

self.addEventListener("activate", function(event){

    event.waitUntil(
        caches.keys().then(function(cacheNames){

            return Promise.all(
                cacheNames
                    .filter(function(cacheName){

                        return cacheName !== CACHE_NAME;

                    })
                    .map(function(cacheName){

                        return caches.delete(cacheName);

                    })
            );

        })
    );

    self.clients.claim();

});

self.addEventListener("fetch", function(event){

    if(event.request.method !== "GET") return;

    const requestUrl = new URL(event.request.url);

    if(requestUrl.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(function(cachedResponse){

            if(cachedResponse){

                return cachedResponse;

            }

            return fetch(event.request).then(function(networkResponse){

                const responseCopy = networkResponse.clone();

                caches.open(CACHE_NAME).then(function(cache){

                    cache.put(event.request, responseCopy);

                });

                return networkResponse;

            }).catch(function(){

                return caches.match("./index.html");

            });

        })
    );

});
