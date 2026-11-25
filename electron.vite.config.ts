import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';
import { resolve } from 'node:path';

/* İçerik güvenlik politikası. Betik yalnızca uygulamanın kendisinden; dış alan adı yok.
   style-src 'unsafe-inline': sahne ve şerit, kaynak sürümdeki gibi öznitelikle satır içi stil yazıyor.
   Geliştirmede (yalnızca orada) HMR için satır içi betik ve yerel websocket açılır. */
function csp(): Plugin {
  return {
    name: 'cma-csp',
    transformIndexHtml(html, ctx) {
      const gelistirme = !!ctx.server;
      const kurallar = [
        "default-src 'self'",
        gelistirme ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        gelistirme ? "connect-src 'self' ws://localhost:* http://localhost:*" : "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-src 'none'",
      ].join('; ');
      return html.replace('<!-- CSP -->', `<meta http-equiv="Content-Security-Policy" content="${kurallar}">`);
    },
  };
}

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve('src/main/index.ts') } },
    },
  },
  preload: {
    build: {
      // Sandbox açık: preload tek dosya ve CommonJS olmalı.
      externalizeDeps: false,
      rollupOptions: {
        input: { index: resolve('src/preload/index.ts') },
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    root: resolve('src/renderer'),
    plugins: [react(), csp()],
    build: {
      // CSS küçültülmez: küçültücü `backdrop-filter` ile `-webkit-backdrop-filter` çiftini tek bir
      // `-webkit-` bildirimine indiriyor; Chromium bunu tanımadığı için cam bulanıklığı kayboluyor.
      cssMinify: false,
      rollupOptions: { input: { index: resolve('src/renderer/index.html') } },
    },
  },
});
