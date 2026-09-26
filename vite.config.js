import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/justwatch': {
        target: 'https://apis.justwatch.com',
        changeOrigin: true,
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.justwatch.com',
          'Referer': 'https://www.justwatch.com/'
        },
        rewrite: (path) => path.replace(/^\/api\/justwatch/, '')
      }
    },
    watch: {
      ignored: ['**/captures_source/**', '**/assets/posters_hd/**']
    }
  }
});
