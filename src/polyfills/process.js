/** react-rnd / react-draggable expect Node's `process` in the browser (Vite has no global). */
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {
      NODE_ENV: import.meta.env.MODE,
    },
  }
}
