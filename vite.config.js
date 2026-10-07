import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La app se sirve igual en local y en GitHub Pages (subruta /openmarket-chart/),
// así que el bundle usa rutas relativas: base './'.
// El servidor escucha en 0.0.0.0 y acepta cualquier host para funcionar dentro
// de contenedores y en el preview remoto.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    cors: true,
  },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
});
