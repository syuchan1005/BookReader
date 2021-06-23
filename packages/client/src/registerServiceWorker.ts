import { Workbox } from 'workbox-window';

let wb: Workbox | undefined;
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  wb = new Workbox('/service-worker.js');
}

// eslint-disable-next-line import/prefer-default-export
export const workbox = wb;
