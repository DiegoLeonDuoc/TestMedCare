// ./service-worker.js

const CACHE_NAME = 'medic-assist-cache-v1';
const urlsToCache = [
    '/',
'/index.html',
'/style.css',
// Add other assets like images, fonts if any
// JS files are usually handled by module loading, but you might cache bundles if you build them
'/js/index.js',
'/js/App.js',
'/js/firebaseConfig.js',
'/js/mockData.js'
];

self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        }
        )
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
