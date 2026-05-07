import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $core: resolve('./core'),
      $editor: resolve('./editor'),
    },
  },
  server: { port: 5173, open: true },
});
