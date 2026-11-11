import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En desarrollo abrís la web en 5173. Vite manda lo que empieza con /api al backend en 3000.
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
