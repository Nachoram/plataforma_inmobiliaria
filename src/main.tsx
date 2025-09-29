import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { validateEnvironment } from './config/envValidator';
import App from './App.tsx';
import './index.css';

// 🚀 Validación de entorno (modo desarrollo - no falla si faltan variables)
validateEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
