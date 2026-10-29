import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const artifactsDir = '/opt/cursor/artifacts';
const videoDir = path.join(artifactsDir, 'videos');
const screenshotsDir = path.join(artifactsDir, 'screenshots');

// Ensure directories exist
[artifactsDir, videoDir, screenshotsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('Starting Patent Readiness Studio walkthrough...\n');
  
  const browser = await chromium.launch({
    headless: true,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 },
    },
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the studio
    console.log('1. Navigating to Patent Readiness Studio...');
    await page.goto('http://localhost:3000/studio', { waitUntil: 'networkidle' });
    await delay(2000);
    
    // Screenshot 1: Applicant tab
    console.log('2. Capturing Applicant tab...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-applicant-tab.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Click into Examiner tab
    console.log('3. Navigating to Examiner tab...');
    const examinerTab = await page.getByRole('button', { name: /examiner/i }).first();
    await examinerTab.click();
    await delay(3000);
    
    // Screenshot 2: Examiner tab
    console.log('4. Capturing Examiner tab...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-examiner-tab.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Override F-01 finding
    console.log('5. Overriding finding F-01...');
    const overrideRadio = await page.locator('input[value="override"]').first();
    await overrideRadio.click();
    await delay(1000);
    
    // Fill override reason
    const reasonInput = await page.locator('textarea[placeholder*="reason"]').first();
    await reasonInput.fill('Spec ¶[0027] adequately describes threshold determination methodology');
    await delay(1000);
    
    const whereInput = await page.locator('input[placeholder*="where"]').first();
    await whereInput.fill('¶[0027], lines 4-6');
    await delay(1000);
    
    // Screenshot 3: Examiner tab with override
    console.log('6. Capturing Examiner tab with override...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-examiner-override.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Open What-if panel
    console.log('7. Opening What-if panel...');
    const whatIfBtn = await page.getByRole('button', { name: /what-if/i }).first();
    await whatIfBtn.click();
    await delay(2000);
    
    // Screenshot 4: What-if panel
    console.log('8. Capturing What-if panel...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-what-if-panel.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Close What-if
    const closeWhatIf = await page.getByRole('button', { name: /close/i }).first();
    await closeWhatIf.click();
    await delay(1000);
    
    // Open Trace drawer
    console.log('9. Opening Trace drawer...');
    const traceBtn = await page.getByRole('button', { name: /trace/i }).first();
    await traceBtn.click();
    await delay(2000);
    
    // Screenshot 5: Trace drawer
    console.log('10. Capturing Trace drawer...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-trace-drawer.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Close trace drawer
    const closeTrace = await page.getByRole('button', { name: /close/i }).first();
    await closeTrace.click();
    await delay(1000);
    
    // Click Evaluation tab
    console.log('11. Navigating to Evaluation tab...');
    const evalTab = await page.getByRole('button', { name: /evaluation/i }).first();
    await evalTab.click();
    await delay(3000);
    
    // Screenshot 6: Evaluation tab
    console.log('12. Capturing Evaluation tab...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-evaluation-tab.png'),
      fullPage: true,
    });
    await delay(2000);
    
    console.log('\n✓ Walkthrough complete!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('Error during walkthrough:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  // Get the video path
  const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    const videoPath = path.join(videoDir, videoFiles[0]);
    console.log(`\nVideo recorded: ${videoPath}`);
    return videoPath;
  }
  
  return null;
}

runDemo()
  .then((videoPath) => {
    console.log('\n✓ All done!');
    if (videoPath) {
      console.log(`Video path: ${videoPath}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Failed:', error);
    process.exit(1);
  });
