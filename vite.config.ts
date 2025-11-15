import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Projeto-barbearia/',   // nome exato do repositório
  resolve: {
    alias: {
      '@': '/src',               // assim não precisa de "path" nem "__dirname"
    },
  },
})
