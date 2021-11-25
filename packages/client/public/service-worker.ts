/* eslint-disable */
import { skipWaiting, clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

setCacheNameDetails({ prefix: 'bookReader' });
skipWaiting();
clientsClaim();
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// https://developers.google.com/web/tools/workbox/guides/common-recipes
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  }),
);

// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  }),
);

const cacheNames = {
  thumbnail: 'bookReader-thumbnail-v1',
  image: 'bookReader-image-v1',
};
registerRoute(
  ({ request, url }) => request.destination === 'image'
    && url.searchParams.has('nosave'),
  new StaleWhileRevalidate({
    cacheName: cacheNames.image,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => request.destination === 'image'
    && !url.searchParams.has('nosave')
    && url.pathname.startsWith('/book/'),
  new StaleWhileRevalidate({
    cacheName: cacheNames.thumbnail,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  }),
);

const oldCacheNames = [
  'bookReader-thumbnails',
  'bookReader-images',
];
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all(oldCacheNames.map((name) => caches.delete(name)))
  );
});

addEventListener('message', (event) => {
  // When no response, client cannot resolve Promise.
  const postMessage = (arg = true) => event.ports[0].postMessage(arg);
  if (!event.data || !event.data.type) {
    postMessage();
    return;
  }

  const onMessage = async () => {
    switch (event.data.type) {
      // eslint-disable-next-line default-case-last
      default:
      case 'SKIP_WAITING':
        skipWaiting();
        break;
      case 'PURGE_CACHE': {
        const ks = await caches.keys();
        await Promise.all(ks.map((k) => caches.delete(k)));
        break;
      }
      case 'REMOVE_BOOK_CACHE': {
        const imageFolderPath = new RegExp(`/book/${event.data.bookId}`);
        const deleteCaches = Object.values(cacheNames).map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const cacheRequests = await cache.keys();
          const deleteRequests = cacheRequests
            .filter(({ url }) => url.match(imageFolderPath));
          return Promise.all(deleteRequests.map((request) => cache.delete(request)));
        });
        await Promise.all(deleteCaches);
        break;
      }
    }

    postMessage();
  };

  // @ts-ignore waitUntil is not resolved
  event.waitUntil(onMessage());
});
