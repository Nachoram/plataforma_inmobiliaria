import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analyze bundle size and lazy loading
function analyzeBundle() {
  console.log('🔍 Analyzing bundle size and lazy loading...\n');

  try {
    // Read dist directory
    const distPath = path.join(__dirname, '..', 'dist');
    const assetsPath = path.join(distPath, 'assets');

    if (!fs.existsSync(assetsPath)) {
      console.log('❌ Dist directory not found. Run `npm run build` first.');
      return;
    }

    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    console.log('📦 Bundle Analysis Results:');
    console.log('==========================\n');

    let totalSize = 0;
    const bundleSizes = [];

    jsFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;

      bundleSizes.push({
        name: file,
        size: parseFloat(sizeKB),
        sizeBytes: stats.size
      });

      // Identify lazy-loaded chunks
      if (file.includes('BuyerOfferSummaryTab') ||
          file.includes('OfferDocumentsTab') ||
          file.includes('OfferMessagesTab') ||
          file.includes('OfferActionsTab')) {
        console.log(`🚀 Lazy-loaded: ${file} - ${sizeKB} KB`);
      } else if (file.includes('vendor') || file.includes('index')) {
        console.log(`📦 Core bundle: ${file} - ${sizeKB} KB`);
      } else {
        console.log(`📄 Other chunk: ${file} - ${sizeKB} KB`);
      }
    });

    const totalSizeKB = (totalSize / 1024).toFixed(2);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    console.log('\n📊 Summary:');
    console.log(`Total bundle size: ${totalSizeKB} KB (${totalSizeMB} MB)`);

    // Check if bundle size is reasonable
    const maxBundleSize = 1024 * 1024; // 1MB
    if (totalSize > maxBundleSize) {
      console.log('⚠️  Bundle size exceeds 1MB. Consider code splitting.');
    } else {
      console.log('✅ Bundle size is within acceptable limits.');
    }

    // Check lazy loading effectiveness
    const lazyChunks = bundleSizes.filter(bundle =>
      bundle.name.includes('BuyerOfferSummaryTab') ||
      bundle.name.includes('OfferDocumentsTab') ||
      bundle.name.includes('OfferMessagesTab') ||
      bundle.name.includes('OfferActionsTab')
    );

    if (lazyChunks.length >= 4) {
      console.log('✅ All lazy-loaded components are properly chunked.');
      const avgLazySize = lazyChunks.reduce((sum, chunk) => sum + chunk.size, 0) / lazyChunks.length;
      console.log(`📏 Average lazy chunk size: ${avgLazySize.toFixed(2)} KB`);
    } else {
      console.log('⚠️  Some lazy-loaded components may not be properly chunked.');
    }

    console.log('\n🎯 Performance Recommendations:');

    // Performance analysis
    const mainBundle = bundleSizes.find(b => b.name.includes('index') && !b.name.includes('es'));
    if (mainBundle && mainBundle.size > 100) {
      console.log('⚠️  Main bundle is large. Consider lazy loading more components.');
    } else {
      console.log('✅ Main bundle size is optimal.');
    }

    const vendorBundle = bundleSizes.find(b => b.name.includes('vendor'));
    if (vendorBundle) {
      console.log(`📚 Vendor bundle: ${vendorBundle.size.toFixed(2)} KB`);
      if (vendorBundle.size > 200) {
        console.log('⚠️  Vendor bundle is large. Consider tree shaking.');
      } else {
        console.log('✅ Vendor bundle size is reasonable.');
      }
    }

    console.log('\n✨ Bundle analysis complete!');

  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
  }
}

// Run analysis
analyzeBundle();
