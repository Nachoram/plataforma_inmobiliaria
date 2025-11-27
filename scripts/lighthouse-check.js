import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLighthouseCheck() {
  console.log('🏮 Running Lighthouse Performance Check...\n');

  try {
    // Check if Lighthouse CLI is available
    try {
      execSync('lighthouse --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('⚠️  Lighthouse CLI not found. Installing...');
      execSync('npm install -g lighthouse', { stdio: 'inherit' });
    }

    // Check if dev server is running
    console.log('🔍 Checking if development server is running...');

    try {
      execSync('curl -s http://localhost:5173 > /dev/null', { stdio: 'pipe' });
      console.log('✅ Development server is running');
    } catch (error) {
      console.log('❌ Development server not running. Starting...');
      // Note: We can't start the dev server from here as it would block
      console.log('Please run `npm run dev` in another terminal first.');
      return;
    }

    // Run Lighthouse audit
    console.log('📊 Running Lighthouse audit...');

    const lighthouseCommand = `lighthouse http://localhost:5173/my-offers/test-offer-123/details --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"`;

    try {
      execSync(lighthouseCommand, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Lighthouse audit completed with warnings');
    }

    // Read and analyze results
    const reportPath = path.join(process.cwd(), 'lighthouse-report.json');

    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const categories = report.categories;

      console.log('\n📈 Lighthouse Scores:');
      console.log('=====================\n');

      const scores = {
        Performance: categories.performance.score * 100,
        Accessibility: categories.accessibility.score * 100,
        'Best Practices': categories['best-practices'].score * 100,
        SEO: categories.seo.score * 100,
        PWA: categories.pwa.score * 100
      };

      Object.entries(scores).forEach(([category, score]) => {
        const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
        console.log(`${emoji} ${category}: ${score.toFixed(1)}`);
      });

      console.log('\n🎯 Performance Metrics:');
      console.log('=======================\n');

      const audits = report.audits;

      // Key performance metrics
      const metrics = [
        { name: 'First Contentful Paint', key: 'first-contentful-paint' },
        { name: 'Largest Contentful Paint', key: 'largest-contentful-paint' },
        { name: 'First Input Delay', key: 'max-potential-fid' },
        { name: 'Cumulative Layout Shift', key: 'cumulative-layout-shift' }
      ];

      metrics.forEach(metric => {
        if (audits[metric.key]) {
          const value = audits[metric.key].displayValue;
          const score = audits[metric.key].score;
          const emoji = score >= 0.9 ? '🟢' : score >= 0.5 ? '🟡' : '🔴';
          console.log(`${emoji} ${metric.name}: ${value}`);
        }
      });

      // Bundle size check
      if (audits['total-byte-weight']) {
        const bundleSize = audits['total-byte-weight'].displayValue;
        console.log(`📦 Bundle Size: ${bundleSize}`);

        const sizeInBytes = audits['total-byte-weight'].numericValue;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        if (sizeInMB > 2) {
          console.log('⚠️  Bundle size is large. Consider code splitting.');
        } else if (sizeInMB > 1) {
          console.log('🟡 Bundle size is moderate.');
        } else {
          console.log('✅ Bundle size is optimal.');
        }
      }

      // Clean up
      fs.unlinkSync(reportPath);

      console.log('\n✨ Lighthouse check complete!');

      // Overall assessment
      const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

      console.log('\n🏆 Overall Assessment:');
      if (avgScore >= 90) {
        console.log('🟢 Excellent! All scores are above 90.');
      } else if (avgScore >= 75) {
        console.log('🟡 Good! Scores are above 75. Minor improvements possible.');
      } else if (avgScore >= 50) {
        console.log('🟠 Needs improvement. Focus on performance and accessibility.');
      } else {
        console.log('🔴 Requires significant improvements.');
      }

    } else {
      console.log('❌ Lighthouse report not generated');
    }

  } catch (error) {
    console.error('❌ Error running Lighthouse check:', error.message);
    console.log('\n💡 Tips:');
    console.log('- Make sure the development server is running on http://localhost:5173');
    console.log('- Install Lighthouse globally: npm install -g lighthouse');
    console.log('- For CI/CD, consider using lighthouse-ci');
  }
}

// Run the check
runLighthouseCheck();
