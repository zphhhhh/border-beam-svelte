import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

// On GitHub Pages the demo is served from the project subpath
// (https://<user>.github.io/border-beam-svelte/), so assets must be
// referenced relative to that base in production. Locally `base` stays '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/border-beam-svelte/' : '/',
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
    },
  },
  server: {
    port: 5179,
  },
}));
