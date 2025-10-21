import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite maneja automáticamente las variables de entorno que comienzan con VITE_
  // No es necesario definir process.env manualmente
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://primary-production-bafdc.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/webhook'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react'],

          // Feature chunks
          'contracts': [
            './src/components/contracts/ContractManagementPage.tsx',
            './src/components/contracts/ContractViewerPage.tsx',
            './src/components/contracts/ContractViewer.tsx',
            './src/components/contracts/ContractEditor.tsx',
            './src/components/contracts/HTMLContractViewer.tsx',
            './src/components/contracts/ContractApprovalWorkflow.tsx'
          ],
          'properties': [
            './src/components/properties/PropertyFormPage.tsx',
            './src/components/properties/PropertyForm.tsx',
            './src/components/properties/PropertyDetailsPage.tsx',
            './src/components/properties/RentalApplicationForm.tsx',
            './src/components/properties/SalePublicationForm.tsx'
          ],
          'dashboard': [
            './src/components/dashboard/ApplicationsPage.tsx',
            './src/components/portfolio/PortfolioPage.tsx'
          ],
          'auth': [
            './src/components/auth/AuthPage.tsx',
            './src/components/auth/AuthForm.tsx'
          ],
          'marketplace': [
            './src/components/panel/PanelPage.tsx',
            './src/components/panel/OfferModal.tsx'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600 // Increase warning limit to 600kb
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
