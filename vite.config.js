import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // O GitHub Pages coloca seu site em uma subpasta com o nome do repositório
  base: '/logistica/', 
})
