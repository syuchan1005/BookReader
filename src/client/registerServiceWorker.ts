import { Workbox } from 'workbox-window';

if (process.env.NODE_ENV === 'production') {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/service-worker.js');

    wb.register();
  }
}
