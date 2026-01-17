const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Evaluation Report Structure
const report = {
  uiUx: { score: 0, findings: [], screenshots: [] },
  performance: { score: 0, metrics: {}, findings: [] },
  codeQuality: { score: 0, findings: [] },
  security: { score: 0, findings: [] },
  features: { score: 0, findings: [], availableFeatures: [] },
  overallScore: 0
};

// Create output directory
const outputDir = 'site-evaluation-output';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exploreSite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  try {
    console.log('🌐 Starting site exploration...\n');
    
    // Navigate to homepage
    const startTime = Date.now();
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`✓ Page loaded in ${loadTime}ms`);
    report.performance.metrics.pageLoadTime = loadTime;
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    const screenshotPath = path.join(outputDir, 'homepage-full.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.uiUx.screenshots.push('homepage-full.png');
    console.log(`✓ Screenshot saved: ${screenshotPath}`);
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`\n📄 Page Info:`);
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);
    
    // === UI/UX EVALUATION ===
    console.log('\n🎨 Evaluating UI/UX...');
    await evaluateUIUX(page);
    
    // === PERFORMANCE EVALUATION ===
    console.log('\n⚡ Evaluating Performance...');
    await evaluatePerformance(page);
    
    // === CODE QUALITY EVALUATION ===
    console.log('\n💻 Evaluating Code Quality...');
    await evaluateCodeQuality(page, consoleMessages);
    
    // === SECURITY EVALUATION ===
    console.log('\n🔒 Evaluating Security...');
    await evaluateSecurity(page);
    
    // === FEATURES EVALUATION ===
    console.log('\n✨ Evaluating Features...');
    await evaluateFeatures(page);
    
    // Take responsive screenshots
    console.log('\n📱 Capturing responsive screenshots...');
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      const vpScreenshot = path.join(outputDir, `homepage-${viewport.name}.png`);
      await page.screenshot({ path: vpScreenshot, fullPage: true });
      report.uiUx.screenshots.push(`homepage-${viewport.name}.png`);
      console.log(`   ✓ ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
    
  } catch (error) {
    console.error('❌ Error during exploration:', error.message);
    report.uiUx.findings.push(`✗ Navigation error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Calculate overall score
  report.overallScore = Math.round(
    (report.uiUx.score + report.performance.score + report.codeQuality.score + 
     report.security.score + report.features.score) / 5
  );
  
  // Generate reports
  generateReports();
}

async function evaluateUIUX(page) {
  const findings = [];
  
  // Check semantic HTML
  const hasHeader = await page.locator('header, [role="banner"]').count() > 0;
  const hasNav = await page.locator('nav, [role="navigation"]').count() > 0;
  const hasMain = await page.locator('main, [role="main"]').count() > 0;
  const hasFooter = await page.locator('footer, [role="contentinfo"]').count() > 0;
  
  if (hasHeader) findings.push('✓ Semantic header element found');
  else findings.push('✗ Missing semantic header element');
  
  if (hasNav) findings.push('✓ Navigation element found');
  else findings.push('⚠ Missing navigation element');
  
  if (hasMain) findings.push('✓ Main content element found');
  else findings.push('✗ Missing main content element');
  
  if (hasFooter) findings.push('✓ Footer element found');
  else findings.push('⚠ Missing footer element');
  
  // Check accessibility
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt === 0) {
    findings.push('✓ All images have alt attributes');
  } else {
    findings.push(`✗ ${imagesWithoutAlt} images missing alt attributes`);
  }
  
  // Check for skip links
  const hasSkipLink = await page.locator('a[href*="#main"], a[href*="#content"]').count() > 0;
  if (hasSkipLink) findings.push('✓ Skip navigation link found');
  
  // Check for proper headings
  const h1Count = await page.locator('h1').count();
  if (h1Count === 1) findings.push('✓ Exactly one H1 heading (good)');
  else if (h1Count === 0) findings.push('✗ No H1 heading found');
  else findings.push(`⚠ Multiple H1 headings found (${h1Count})`);
  
  // Check interactive elements
  const buttons = await page.locator('button, [role="button"]').count();
  const links = await page.locator('a').count();
  findings.push(`Interactive elements: ${buttons} buttons, ${links} links`);
  
  report.uiUx.findings = findings;
  
  // Calculate score
  const positiveFindings = findings.filter(f => f.startsWith('✓')).length;
  const negativeFindings = findings.filter(f => f.startsWith('✗')).length;
  report.uiUx.score = Math.max(0, 100 - (negativeFindings * 15) + (positiveFindings * 5));
  report.uiUx.score = Math.min(100, report.uiUx.score);
  
  findings.forEach(f => console.log(`   ${f}`));
}

async function evaluatePerformance(page) {
  const findings = [];
  
  // Get performance metrics
  const metrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    const paintMetrics = performance.getEntriesByType('paint');
    const fcp = paintMetrics.find(entry => entry.name === 'first-contentful-paint');
    
    return {
      domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart : 0,
      domInteractive: perfData ? perfData.domInteractive - perfData.fetchStart : 0,
      firstContentfulPaint: fcp ? fcp.startTime : 0,
    };
  });
  
  report.performance.metrics = {
    ...report.performance.metrics,
    ...metrics
  };
  
  // Evaluate load time
  if (report.performance.metrics.pageLoadTime < 3000) {
    findings.push(`✓ Excellent page load time: ${report.performance.metrics.pageLoadTime}ms`);
  } else if (report.performance.metrics.pageLoadTime < 5000) {
    findings.push(`⚠ Good page load time: ${report.performance.metrics.pageLoadTime}ms`);
  } else {
    findings.push(`✗ Slow page load time: ${report.performance.metrics.pageLoadTime}ms`);
  }
  
  // Evaluate FCP
  if (metrics.firstContentfulPaint < 1800) {
    findings.push(`✓ Fast First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
  } else if (metrics.firstContentfulPaint < 3000) {
    findings.push(`⚠ Acceptable First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
  } else {
    findings.push(`✗ Slow First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`);
  }
  
  // Check resources
  const resourceStats = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return {
      total: resources.length,
      scripts: resources.filter(r => r.initiatorType === 'script').length,
      stylesheets: resources.filter(r => r.initiatorType === 'css' || r.initiatorType === 'link').length,
      images: resources.filter(r => r.initiatorType === 'img').length,
    };
  });
  
  findings.push(`Resources: ${resourceStats.total} total (${resourceStats.scripts} scripts, ${resourceStats.stylesheets} CSS, ${resourceStats.images} images)`);
  
  if (resourceStats.total < 50) findings.push('✓ Reasonable number of resources');
  else if (resourceStats.total < 100) findings.push('⚠ Moderate number of resources');
  else findings.push('✗ High number of resources may impact performance');
  
  report.performance.findings = findings;
  
  // Calculate score
  let score = 100;
  if (report.performance.metrics.pageLoadTime > 5000) score -= 30;
  else if (report.performance.metrics.pageLoadTime > 3000) score -= 15;
  
  if (metrics.firstContentfulPaint > 3000) score -= 25;
  else if (metrics.firstContentfulPaint > 1800) score -= 10;
  
  if (resourceStats.total > 100) score -= 15;
  else if (resourceStats.total > 50) score -= 5;
  
  report.performance.score = Math.max(0, score);
  
  findings.forEach(f => console.log(`   ${f}`));
}

async function evaluateCodeQuality(page, consoleMessages) {
  const findings = [];
  
  // Check console errors
  const errors = consoleMessages.filter(m => m.type === 'error');
  if (errors.length === 0) {
    findings.push('✓ No console errors detected');
  } else {
    findings.push(`✗ ${errors.length} console error(s) detected`);
    errors.slice(0, 3).forEach(err => {
      findings.push(`  - ${err.text.substring(0, 100)}`);
    });
  }
  
  // HTML validation
  const htmlIssues = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    const duplicateIds = ids.length - new Set(ids).size;
    const invalidNesting = document.querySelectorAll('p p, a a').length;
    
    return { duplicateIds, invalidNesting };
  });
  
  if (htmlIssues.duplicateIds === 0) findings.push('✓ No duplicate IDs');
  else findings.push(`✗ ${htmlIssues.duplicateIds} duplicate ID(s)`);
  
  if (htmlIssues.invalidNesting === 0) findings.push('✓ No invalid HTML nesting');
  else findings.push(`✗ ${htmlIssues.invalidNesting} invalid nesting issue(s)`);
  
  // Check meta tags
  const metaTags = await page.evaluate(() => ({
    viewport: !!document.querySelector('meta[name="viewport"]'),
    description: !!document.querySelector('meta[name="description"]'),
    charset: !!document.querySelector('meta[charset]'),
    title: document.title && document.title.length > 0
  }));
  
  if (metaTags.viewport) findings.push('✓ Viewport meta tag present');
  else findings.push('✗ Missing viewport meta tag');
  
  if (metaTags.description) findings.push('✓ Description meta tag present');
  else findings.push('⚠ Missing description meta tag');
  
  if (metaTags.charset) findings.push('✓ Charset declaration present');
  else findings.push('✗ Missing charset declaration');
  
  if (metaTags.title) findings.push('✓ Page title present');
  else findings.push('✗ Missing page title');
  
  report.codeQuality.findings = findings;
  
  // Calculate score
  const positiveFindings = findings.filter(f => f.startsWith('✓')).length;
  const negativeFindings = findings.filter(f => f.startsWith('✗')).length;
  report.codeQuality.score = Math.max(0, Math.min(100, 70 + (positiveFindings * 5) - (negativeFindings * 10)));
  
  findings.forEach(f => console.log(`   ${f}`));
}

async function evaluateSecurity(page) {
  const findings = [];
  
  // Check URL protocol
  const url = page.url();
  if (url.startsWith('https://')) {
    findings.push('✓ Using HTTPS');
  } else if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    findings.push('⚠ Local development (HTTP expected)');
  } else {
    findings.push('✗ Not using HTTPS');
  }
  
  // Check for security headers (browser-accessible checks)
  const securityChecks = await page.evaluate(() => {
    return {
      hasCSPMeta: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
      cookieInfo: document.cookie ? 'Cookies present' : 'No cookies set'
    };
  });
  
  if (securityChecks.hasCSPMeta) findings.push('✓ Content Security Policy meta tag found');
  
  // Check password fields
  const passwordFields = await page.locator('input[type="password"]').count();
  if (passwordFields > 0) {
    findings.push(`Found ${passwordFields} password field(s)`);
    const withAutocomplete = await page.locator('input[type="password"][autocomplete]').count();
    if (withAutocomplete > 0) findings.push('✓ Password fields have autocomplete attributes');
  }
  
  // Check for external scripts
  const externalScripts = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const external = scripts
      .map(s => s.src)
      .filter(src => src && !src.includes(window.location.hostname) && !src.startsWith('blob:'))
      .map(src => {
        try {
          return new URL(src).hostname;
        } catch {
          return src;
        }
      });
    return [...new Set(external)];
  });
  
  if (externalScripts.length > 0) {
    findings.push(`⚠ ${externalScripts.length} external script source(s)`);
    findings.push(`  Sources: ${externalScripts.slice(0, 3).join(', ')}${externalScripts.length > 3 ? '...' : ''}`);
  } else {
    findings.push('✓ No external scripts detected');
  }
  
  // Check for forms
  const forms = await page.locator('form').count();
  if (forms > 0) {
    findings.push(`Found ${forms} form(s)`);
    const formsWithHiddenFields = await page.locator('form input[type="hidden"]').count();
    if (formsWithHiddenFields > 0) findings.push('✓ Forms contain hidden fields (possible CSRF tokens)');
  }
  
  report.security.findings = findings;
  
  // Calculate score
  const positiveFindings = findings.filter(f => f.startsWith('✓')).length;
  const negativeFindings = findings.filter(f => f.startsWith('✗')).length;
  const warningFindings = findings.filter(f => f.startsWith('⚠')).length;
  report.security.score = Math.max(0, Math.min(100, 70 + (positiveFindings * 10) - (negativeFindings * 15) - (warningFindings * 3)));
  
  findings.forEach(f => console.log(`   ${f}`));
}

async function evaluateFeatures(page) {
  const findings = [];
  const features = [];
  
  // Check for auth elements
  const signInButton = await page.locator('a[href*="sign-in"], button:has-text("Sign In"), button:has-text("Login"), a:has-text("Sign In"), a:has-text("Login")').count();
  const signUpButton = await page.locator('a[href*="sign-up"], button:has-text("Sign Up"), button:has-text("Register"), a:has-text("Sign Up"), a:has-text("Register")').count();
  
  if (signInButton > 0) {
    features.push('Authentication - Sign In');
    findings.push('✓ Sign in functionality available');
  }
  
  if (signUpButton > 0) {
    features.push('Authentication - Sign Up');
    findings.push('✓ Sign up functionality available');
  }
  
  // Check for navigation
  const navLinks = await page.locator('nav a, header a').count();
  if (navLinks > 0) {
    features.push('Navigation');
    findings.push(`✓ Navigation with ${navLinks} link(s)`);
  }
  
  // Check for dashboard
  const hasDashboard = await page.locator('[href*="dashboard"], [class*="dashboard"], :has-text("Dashboard")').count() > 0;
  if (hasDashboard) {
    features.push('Dashboard');
    findings.push('✓ Dashboard interface detected');
  }
  
  // Check for projects
  const hasProjects = await page.locator('[href*="project"], [class*="project"], :has-text("Project")').count() > 0;
  if (hasProjects) {
    features.push('Projects');
    findings.push('✓ Project management features detected');
  }
  
  // Check for tasks
  const hasTasks = await page.locator('[href*="task"], [class*="task"], :has-text("Task")').count() > 0;
  if (hasTasks) {
    features.push('Tasks');
    findings.push('✓ Task management features detected');
  }
  
  // Check for search
  const hasSearch = await page.locator('input[type="search"], input[placeholder*="search" i]').count() > 0;
  if (hasSearch) {
    features.push('Search');
    findings.push('✓ Search functionality available');
  }
  
  // Check for settings
  const hasSettings = await page.locator('[href*="settings"], [aria-label*="settings" i], :has-text("Settings")').count() > 0;
  if (hasSettings) {
    features.push('Settings');
    findings.push('✓ Settings page available');
  }
  
  // Check for theme toggle
  const hasThemeToggle = await page.locator('[aria-label*="theme" i], [class*="theme"], button:has-text("Dark"), button:has-text("Light")').count() > 0;
  if (hasThemeToggle) {
    features.push('Theme Switcher');
    findings.push('✓ Theme switching capability');
  }
  
  // Interactive elements count
  const buttons = await page.locator('button').count();
  const inputs = await page.locator('input').count();
  findings.push(`Interactive elements: ${buttons} buttons, ${inputs} inputs`);
  
  report.features.availableFeatures = features;
  report.features.findings = findings;
  
  // Calculate score
  const expectedFeatures = ['Authentication - Sign In', 'Navigation', 'Dashboard', 'Projects', 'Tasks'];
  const foundExpectedFeatures = expectedFeatures.filter(ef => features.includes(ef)).length;
  let score = (foundExpectedFeatures / expectedFeatures.length) * 70;
  score += Math.min(features.length, 10) * 3;
  report.features.score = Math.min(100, Math.round(score));
  
  findings.forEach(f => console.log(`   ${f}`));
}

function generateReports() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SITE EVALUATION REPORT');
  console.log('='.repeat(80));
  
  const getGrade = (score) => {
    if (score >= 90) return 'A (Excellent)';
    if (score >= 80) return 'B (Good)';
    if (score >= 70) return 'C (Satisfactory)';
    if (score >= 60) return 'D (Needs Improvement)';
    return 'F (Poor)';
  };
  
  const getEmoji = (score) => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '✅';
    if (score >= 70) return '👍';
    if (score >= 60) return '⚠️';
    return '❌';
  };
  
  let markdown = '# Site Evaluation Report\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `## Overall Score: ${report.overallScore}/100 ${getEmoji(report.overallScore)} - ${getGrade(report.overallScore)}\n\n`;
  markdown += '---\n\n';
  
  // UI/UX
  markdown += `## 1. UI/UX ${getEmoji(report.uiUx.score)}\n\n`;
  markdown += `**Score:** ${report.uiUx.score}/100 - ${getGrade(report.uiUx.score)}\n\n`;
  markdown += '### Findings:\n';
  report.uiUx.findings.forEach(f => markdown += `- ${f}\n`);
  if (report.uiUx.screenshots.length > 0) {
    markdown += '\n### Screenshots:\n';
    report.uiUx.screenshots.forEach(s => markdown += `- ${s}\n`);
  }
  markdown += '\n';
  
  // Performance
  markdown += `## 2. Performance ${getEmoji(report.performance.score)}\n\n`;
  markdown += `**Score:** ${report.performance.score}/100 - ${getGrade(report.performance.score)}\n\n`;
  markdown += '### Metrics:\n';
  markdown += `- Page Load Time: ${report.performance.metrics.pageLoadTime}ms\n`;
  markdown += `- Time to Interactive: ${report.performance.metrics.domInteractive?.toFixed(0) || 0}ms\n`;
  markdown += `- First Contentful Paint: ${report.performance.metrics.firstContentfulPaint?.toFixed(0) || 0}ms\n`;
  markdown += '\n### Findings:\n';
  report.performance.findings.forEach(f => markdown += `- ${f}\n`);
  markdown += '\n';
  
  // Code Quality
  markdown += `## 3. Code Quality ${getEmoji(report.codeQuality.score)}\n\n`;
  markdown += `**Score:** ${report.codeQuality.score}/100 - ${getGrade(report.codeQuality.score)}\n\n`;
  markdown += '### Findings:\n';
  report.codeQuality.findings.forEach(f => markdown += `- ${f}\n`);
  markdown += '\n';
  
  // Security
  markdown += `## 4. Security ${getEmoji(report.security.score)}\n\n`;
  markdown += `**Score:** ${report.security.score}/100 - ${getGrade(report.security.score)}\n\n`;
  markdown += '### Findings:\n';
  report.security.findings.forEach(f => markdown += `- ${f}\n`);
  markdown += '\n';
  
  // Features
  markdown += `## 5. Features ${getEmoji(report.features.score)}\n\n`;
  markdown += `**Score:** ${report.features.score}/100 - ${getGrade(report.features.score)}\n\n`;
  markdown += '### Available Features:\n';
  if (report.features.availableFeatures.length > 0) {
    report.features.availableFeatures.forEach(f => markdown += `- ${f}\n`);
  } else {
    markdown += '- No features detected\n';
  }
  markdown += '\n### Findings:\n';
  report.features.findings.forEach(f => markdown += `- ${f}\n`);
  markdown += '\n';
  
  // Summary Table
  markdown += '## Summary\n\n';
  markdown += '| Category | Score | Grade |\n';
  markdown += '|----------|-------|-------|\n';
  markdown += `| UI/UX | ${report.uiUx.score}/100 | ${getGrade(report.uiUx.score)} |\n`;
  markdown += `| Performance | ${report.performance.score}/100 | ${getGrade(report.performance.score)} |\n`;
  markdown += `| Code Quality | ${report.codeQuality.score}/100 | ${getGrade(report.codeQuality.score)} |\n`;
  markdown += `| Security | ${report.security.score}/100 | ${getGrade(report.security.score)} |\n`;
  markdown += `| Features | ${report.features.score}/100 | ${getGrade(report.features.score)} |\n`;
  markdown += `| **Overall** | **${report.overallScore}/100** | **${getGrade(report.overallScore)}** |\n`;
  
  // Save reports
  const jsonPath = path.join(outputDir, 'site-evaluation-report.json');
  const mdPath = path.join(outputDir, 'SITE-EVALUATION-REPORT.md');
  
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, markdown);
  
  console.log(markdown);
  console.log('='.repeat(80));
  console.log(`\n✅ Reports saved to:`);
  console.log(`   - ${jsonPath}`);
  console.log(`   - ${mdPath}`);
  console.log(`\n📸 Screenshots saved in: ${outputDir}/\n`);
}

// Run the exploration
exploreSite().catch(console.error);
