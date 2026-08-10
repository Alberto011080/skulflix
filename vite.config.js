import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Publicado como GitHub Pages de proyecto: alberto011080.github.io/skulflix/
  base: '/skulflix/',
})
