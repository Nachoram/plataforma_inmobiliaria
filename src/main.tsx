import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { validateEnvironment } from './config/envValidator';
import App from './App.tsx';
import './index.css';

// 🚀 VALIDACIÓN CRÍTICA: Verificar configuración de entorno antes de inicializar la aplicación
// Esto asegura que cualquier error de configuración se detecte inmediatamente y detenga la ejecución
validateEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
