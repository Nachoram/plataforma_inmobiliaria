import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite maneja automáticamente las variables de entorno que comienzan con VITE_
  // No es necesario definir process.env manualmente
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: [
      { 
        find: '@', 
        replacement: path.resolve(__dirname, 'src') 
      },
      { 
        find: '@components', 
        replacement: path.resolve(__dirname, 'src/components') 
      }
    ]
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  }
})
