const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactsDir = '/opt/cursor/artifacts';
const videoDir = path.join(artifactsDir, 'videos');
const screenshotsDir = path.join(artifactsDir, 'screenshots');

// Ensure directories exist
[artifactsDir, videoDir, screenshotsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function delay(ms) {
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
    await page.goto('http://localhost:3000/studio', { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    
    // Screenshot 1: Applicant tab
    console.log('2. Capturing Applicant tab...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-applicant-tab.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Click Examiner tab button
    console.log('3. Navigating to Examiner tab...');
    const examinerBtn = page.locator('a:has-text("Examiner")');
    await examinerBtn.click();
    await delay(3000);
    
    // Screenshot 2: Examiner tab
    console.log('4. Capturing Examiner tab...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-examiner-tab.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Override finding
    console.log('5. Interacting with finding...');
    const overrideRadio = page.locator('input[value="override"]').first();
    if (await overrideRadio.isVisible().catch(() => false)) {
      await overrideRadio.click();
      await delay(1000);
    }
    
    // Screenshot 3: Examiner with interaction
    console.log('6. Capturing Examiner with interaction...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-examiner-interaction.png'),
      fullPage: true,
    });
    await delay(2000);
    
    // Click Evaluation tab
    console.log('7. Navigating to Evaluation tab...');
    const evalBtn = page.locator('a:has-text("Evaluation")');
    await evalBtn.click();
    await delay(3000);
    
    // Screenshot 4: Evaluation tab
    console.log('8. Capturing Evaluation tab...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-evaluation-tab.png'),
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
