#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas de Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico de Vercel - PROPAI Platform\n');

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

function checkConfig() {
  console.log('\n📋 Verificando archivos de configuración:');

  checkFile('package.json', 'package.json');
  checkFile('vercel.json', 'vercel.json');
  checkFile('vite.config.ts', 'vite.config.ts');
  checkFile('.vercelignore', '.vercelignore');
  checkFile('dist/index.html', 'Build output (index.html)');
  checkFile('dist/assets/', 'Build output (assets)');

  // Verificar contenido de vercel.json
  if (fs.existsSync('vercel.json')) {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('\n🔧 Configuración de Vercel:');
    console.log('- Version:', vercelConfig.version);
    console.log('- Build Command:', vercelConfig.buildCommand);
    console.log('- Output Directory:', vercelConfig.outputDirectory);
    console.log('- Rewrites:', vercelConfig.rewrites ? vercelConfig.rewrites.length : 0);
  }

  // Verificar rutas en AppContent.tsx
  if (fs.existsSync('src/components/AppContent.tsx')) {
    const appContent = fs.readFileSync('src/components/AppContent.tsx', 'utf8');
    console.log('\n🛣️  Rutas definidas en AppContent.tsx:');
    const routes = appContent.match(/path="([^"]+)"/g);
    if (routes) {
      routes.forEach(route => {
        const pathMatch = route.match(/path="([^"]+)"/);
        if (pathMatch) {
          console.log(`  - ${pathMatch[1]}`);
        }
      });
    }
  }

  // Verificar variables de entorno
  console.log('\n🌍 Variables de entorno (VITE_):');
  const envFiles = ['.env', '.env.local', '.env.production'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const viteVars = content.split('\n').filter(line =>
        line.startsWith('VITE_') && line.includes('=')
      );
      console.log(`📄 ${file}:`);
      viteVars.forEach(v => {
        const [key] = v.split('=');
        console.log(`  - ${key}: ${v.includes('=') ? '✅ configurado' : '❌ vacío'}`);
      });
    }
  });
}

function checkBuild() {
  console.log('\n🏗️  Verificando build:');

  // Ejecutar build si no existe dist
  if (!fs.existsSync('dist')) {
    console.log('Ejecutando build...');
    const { execSync } = require('child_process');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build completado');
    } catch (error) {
      console.log('❌ Error en build:', error.message);
      return;
    }
  }

  // Verificar archivos críticos
  checkFile('dist/index.html', 'index.html en dist');
  checkFile('dist/assets/index-*.css', 'CSS principal');
  checkFile('dist/assets/index-*.js', 'JavaScript principal');

  // Verificar contenido de index.html
  if (fs.existsSync('dist/index.html')) {
    const indexContent = fs.readFileSync('dist/index.html', 'utf8');
    console.log('\n📄 Contenido de index.html:');
    console.log('- Tiene <div id="root">:', indexContent.includes('<div id="root">'));
    console.log('- Tiene script de main:', indexContent.includes('src/main.tsx') || indexContent.includes('/assets/'));
  }
}

function recommendations() {
  console.log('\n💡 Recomendaciones:');

  console.log('\n1. 🚀 Deploy a Vercel:');
  console.log('   npm run deploy:vercel');

  console.log('\n2. 🔧 Si el problema persiste:');
  console.log('   - Verifica las variables de entorno en Vercel Dashboard');
  console.log('   - Revisa los logs de build en Vercel');
  console.log('   - Limpia el cache: vercel redeploy --no-cache');

  console.log('\n3. 🧪 Pruebas locales:');
  console.log('   npm run preview');
  console.log('   # Luego visita http://localhost:4173/nosotros');

  console.log('\n4. 🔍 Debugging adicional:');
  console.log('   - Abre DevTools > Network en el navegador');
  console.log('   - Verifica que las rutas devuelvan 200 OK');
  console.log('   - Revisa la consola por errores de JavaScript');
}

async function main() {
  checkConfig();
  checkBuild();
  recommendations();

  console.log('\n✨ Diagnóstico completado');
}

main().catch(console.error);
