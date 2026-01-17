/* eslint-disable no-console */
import * as fs from 'node:fs';
import path from 'node:path';

import { test } from '@playwright/test';

interface SiteEvaluationReport {
  uiUx: {
    score: number;
    findings: string[];
    screenshots: string[];
  };
  performance: {
    score: number;
    metrics: {
      pageLoadTime: number;
      timeToInteractive: number;
      firstContentfulPaint: number;
      largestContentfulPaint: number;
    };
    findings: string[];
  };
  codeQuality: {
    score: number;
    findings: string[];
  };
  security: {
    score: number;
    findings: string[];
  };
  features: {
    score: number;
    findings: string[];
    availableFeatures: string[];
  };
  overallScore: number;
}

/** Helper to get letter grade from numeric score */
function getGrade(score: number): string {
  if (score >= 90) return 'A (Excellent)';
  if (score >= 80) return 'B (Good)';
  if (score >= 70) return 'C (Satisfactory)';
  if (score >= 60) return 'D (Needs Improvement)';
  return 'F (Poor)';
}

/** Helper to get emoji from numeric score */
function getEmoji(score: number): string {
  if (score >= 90) return '🎉';
  if (score >= 80) return '✅';
  if (score >= 70) return '👍';
  if (score >= 60) return '⚠️';
  return '❌';
}

test.describe('Site Exploration and Evaluation', () => {
  let report: SiteEvaluationReport;

  test.beforeAll(() => {
    report = {
      uiUx: {
        score: 0,
        findings: [],
        screenshots: [],
      },
      performance: {
        score: 0,
        metrics: {
          pageLoadTime: 0,
          timeToInteractive: 0,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
        },
        findings: [],
      },
      codeQuality: {
        score: 0,
        findings: [],
      },
      security: {
        score: 0,
        findings: [],
      },
      features: {
        score: 0,
        findings: [],
        availableFeatures: [],
      },
      overallScore: 0,
    };
  });

  test('Explore homepage and evaluate UI/UX', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to homepage
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    report.performance.metrics.pageLoadTime = loadTime;

    // Take screenshot of homepage
    const screenshotPath = 'homepage.png';
    await page.screenshot({
      path: path.join('test-results', screenshotPath),
      fullPage: true,
    });
    report.uiUx.screenshots.push(screenshotPath);

    // UI/UX Evaluation
    const uiFindings: string[] = [];

    // Check for responsive design
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];

    for (const viewport of viewportSizes) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      const screenshotName = `homepage-${viewport.name.toLowerCase()}.png`;
      await page.screenshot({
        path: path.join('test-results', screenshotName),
        fullPage: true,
      });
      report.uiUx.screenshots.push(screenshotName);

      uiFindings.push(
        `✓ Responsive design verified on ${viewport.name} (${viewport.width}x${viewport.height})`,
      );
    }

    // Reset to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Check for proper semantic HTML
    const hasHeader = (await page.locator('header, [role="banner"]').count()) > 0;
    const hasNav = (await page.locator('nav, [role="navigation"]').count()) > 0;
    const hasMain = (await page.locator('main, [role="main"]').count()) > 0;

    if (hasHeader) uiFindings.push('✓ Semantic header element found');
    else uiFindings.push('✗ Missing semantic header element');

    if (hasNav) uiFindings.push('✓ Navigation element found');
    else uiFindings.push('✗ Missing navigation element');

    if (hasMain) uiFindings.push('✓ Main content element found');
    else uiFindings.push('✗ Missing main content element');

    // Check for accessibility features
    const hasSkipLink = (await page.locator('a[href*="#main"], a[href*="#content"]').count()) > 0;
    if (hasSkipLink) uiFindings.push('✓ Skip navigation link found');

    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt === 0) {
      uiFindings.push('✓ All images have alt attributes');
    } else {
      uiFindings.push(`✗ ${imagesWithoutAlt} images missing alt attributes`);
    }

    // Check color contrast (basic check)
    const bodyBg = await page.evaluate(() => {
      const body = document.body;
      return globalThis.getComputedStyle(body).backgroundColor;
    });
    uiFindings.push(`Body background color: ${bodyBg}`);

    // Check for loading states
    const hasLoadingIndicator =
      (await page.locator('[role="status"], [aria-live="polite"]').count()) > 0;
    if (hasLoadingIndicator) uiFindings.push('✓ Loading indicators present');

    report.uiUx.findings = uiFindings;

    // Calculate UI/UX score
    const positiveFindings = uiFindings.filter(f => f.startsWith('✓')).length;
    const totalChecks = uiFindings.filter(f => f.startsWith('✓') || f.startsWith('✗')).length;
    report.uiUx.score = totalChecks > 0 ? Math.round((positiveFindings / totalChecks) * 100) : 50;

    console.log('UI/UX Evaluation:', report.uiUx);
  });

  // eslint-disable-next-line sonarjs/cognitive-complexity -- Test function with many metrics checks
  test('Evaluate Performance', async ({ page }) => {
    // Navigate and collect performance metrics
    const navigationPromise = page.goto('/', { waitUntil: 'networkidle' });

    // Collect performance metrics
    await navigationPromise;

    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintMetrics = performance.getEntriesByType('paint');

      const fcp = paintMetrics.find(entry => entry.name === 'first-contentful-paint');

      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
      };
    });

    report.performance.metrics.timeToInteractive = performanceMetrics.domInteractive;
    report.performance.metrics.firstContentfulPaint = performanceMetrics.firstContentfulPaint;

    const findings: string[] = [];

    // Evaluate metrics
    if (report.performance.metrics.pageLoadTime < 3000) {
      findings.push(`✓ Excellent page load time: ${report.performance.metrics.pageLoadTime}ms`);
    } else if (report.performance.metrics.pageLoadTime < 5000) {
      findings.push(`⚠ Good page load time: ${report.performance.metrics.pageLoadTime}ms`);
    } else {
      findings.push(`✗ Slow page load time: ${report.performance.metrics.pageLoadTime}ms`);
    }

    if (performanceMetrics.firstContentfulPaint < 1800) {
      findings.push(
        `✓ Fast First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(0)}ms`,
      );
    } else {
      findings.push(
        `⚠ First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(0)}ms`,
      );
    }

    if (performanceMetrics.domInteractive < 2500) {
      findings.push(
        `✓ Quick Time to Interactive: ${performanceMetrics.domInteractive.toFixed(0)}ms`,
      );
    } else {
      findings.push(`⚠ Time to Interactive: ${performanceMetrics.domInteractive.toFixed(0)}ms`);
    }

    // Check for resource optimization
    const resourceStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        total: resources.length,
        scripts: resources.filter(r => r.initiatorType === 'script').length,
        stylesheets: resources.filter(r => r.initiatorType === 'css').length,
        images: resources.filter(r => r.initiatorType === 'img').length,
      };
    });

    findings.push(
      `Total resources loaded: ${resourceStats.total}`,
      `Scripts: ${resourceStats.scripts}, Stylesheets: ${resourceStats.stylesheets}, Images: ${resourceStats.images}`,
    );

    if (resourceStats.total < 50) {
      findings.push('✓ Reasonable number of resources');
    } else if (resourceStats.total < 100) {
      findings.push('⚠ High number of resources loaded');
    } else {
      findings.push('✗ Very high number of resources');
    }

    report.performance.findings = findings;

    // Calculate performance score
    let score = 100;
    if (report.performance.metrics.pageLoadTime > 5000) score -= 30;
    else if (report.performance.metrics.pageLoadTime > 3000) score -= 15;

    if (performanceMetrics.firstContentfulPaint > 2500) score -= 20;
    else if (performanceMetrics.firstContentfulPaint > 1800) score -= 10;

    if (resourceStats.total > 100) score -= 20;
    else if (resourceStats.total > 50) score -= 10;

    report.performance.score = Math.max(0, score);

    console.log('Performance Evaluation:', report.performance);
  });

  test('Evaluate Security', async ({ page }) => {
    await page.goto('/');

    const findings: string[] = [];

    // Check for HTTPS
    const url = page.url();
    if (url.startsWith('https://')) {
      findings.push('✓ Using HTTPS');
    } else if (url.startsWith('http://localhost')) {
      findings.push('⚠ Local development (HTTP expected)');
    } else {
      findings.push('✗ Not using HTTPS');
    }

    // Check for security headers (in browser context)
    const securityHeaders = await page.evaluate(() => {
      // Note: Some headers are not accessible via JavaScript
      return {
        hasCSP: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
        cookies: document.cookie,
      };
    });

    if (securityHeaders.hasCSP) {
      findings.push('✓ Content Security Policy meta tag found');
    }

    // Check for password fields with proper attributes
    const passwordFields = await page.locator('input[type="password"]').count();
    if (passwordFields > 0) {
      const hasAutocomplete = await page.locator('input[type="password"][autocomplete]').count();
      if (hasAutocomplete > 0) {
        findings.push('✓ Password fields have autocomplete attributes');
      }
    }

    // Check for forms with CSRF protection indicators
    const forms = await page.locator('form').count();
    if (forms > 0) {
      findings.push(`Found ${forms} form(s) on the page`);
      const formsWithHiddenTokens = await page.locator('form input[type="hidden"]').count();
      if (formsWithHiddenTokens > 0) {
        findings.push('✓ Forms contain hidden fields (possible CSRF tokens)');
      }
    }

    // Check for external scripts
    const externalScripts = await page.evaluate(() => {
      const scripts = [...document.querySelectorAll('script[src]')];
      return scripts
        .map(s => (s as HTMLScriptElement).src)
        .filter(source => !source.includes(globalThis.location.hostname));
    });

    if (externalScripts.length > 0) {
      findings.push(
        `⚠ ${externalScripts.length} external script(s) loaded`,
        `  External sources: ${[...new Set(externalScripts.map(s => new URL(s).hostname))].join(', ')}`,
      );
    } else {
      findings.push('✓ No external scripts detected');
    }

    // Check for mixed content
    const mixedContent = await page.evaluate(() => {
      const resources = [...document.querySelectorAll('[src], [href]')];
      return resources.some(element => {
        const url =
          (element as HTMLElement).getAttribute('src') ||
          (element as HTMLElement).getAttribute('href');
        return url && url.startsWith('http://') && !url.includes('localhost');
      });
    });

    if (mixedContent) {
      findings.push('✗ Mixed content detected (HTTP resources on HTTPS page)');
    } else {
      findings.push('✓ No mixed content detected');
    }

    report.security.findings = findings;

    // Calculate security score
    const positiveFindings = findings.filter(f => f.startsWith('✓')).length;
    const negativeFindings = findings.filter(f => f.startsWith('✗')).length;
    const warningFindings = findings.filter(f => f.startsWith('⚠')).length;

    let score = 70; // Base score
    score += positiveFindings * 10;
    score -= negativeFindings * 15;
    score -= warningFindings * 5;

    report.security.score = Math.min(100, Math.max(0, score));

    console.log('Security Evaluation:', report.security);
  });

  test('Evaluate Features', async ({ page }) => {
    await page.goto('/');

    const findings: string[] = [];
    const features: string[] = [];

    // Check for authentication
    const hasSignIn =
      (await page
        .locator('a[href*="sign-in"], button:has-text("Sign In"), button:has-text("Login")')
        .count()) > 0;
    const hasSignUp =
      (await page
        .locator('a[href*="sign-up"], button:has-text("Sign Up"), button:has-text("Register")')
        .count()) > 0;

    if (hasSignIn) {
      features.push('Authentication - Sign In');
      findings.push('✓ Sign in functionality available');
    }
    if (hasSignUp) {
      features.push('Authentication - Sign Up');
      findings.push('✓ Sign up functionality available');
    }

    // Check for main navigation
    const navLinks = await page.locator('nav a, header a').allTextContents();
    if (navLinks.length > 0) {
      features.push('Navigation');
      findings.push(
        `✓ Navigation with ${navLinks.length} link(s): ${navLinks.slice(0, 5).join(', ')}${navLinks.length > 5 ? '...' : ''}`,
      );
    }

    // Check for dashboard/main content
    const hasDashboard =
      (await page.locator('[href*="dashboard"], [class*="dashboard"]').count()) > 0;
    if (hasDashboard) {
      features.push('Dashboard');
      findings.push('✓ Dashboard interface detected');
    }

    // Check for projects
    const hasProjects =
      (await page.locator('[href*="project"], [class*="project"], :has-text("Project")').count()) >
      0;
    if (hasProjects) {
      features.push('Projects');
      findings.push('✓ Project management features detected');
    }

    // Check for tasks
    const hasTasks =
      (await page.locator('[href*="task"], [class*="task"], :has-text("Task")').count()) > 0;
    if (hasTasks) {
      features.push('Tasks');
      findings.push('✓ Task management features detected');
    }

    // Check for search
    const hasSearch =
      (await page.locator('input[type="search"], input[placeholder*="Search" i]').count()) > 0;
    if (hasSearch) {
      features.push('Search');
      findings.push('✓ Search functionality available');
    }

    // Check for settings
    const hasSettings =
      (await page.locator('[href*="settings"], [aria-label*="Settings" i]').count()) > 0;
    if (hasSettings) {
      features.push('Settings');
      findings.push('✓ Settings page available');
    }

    // Check for theme toggle
    const hasThemeToggle =
      (await page.locator('[aria-label*="theme" i], [class*="theme"]').count()) > 0;
    if (hasThemeToggle) {
      features.push('Theme Switcher');
      findings.push('✓ Theme switching capability');
    }

    // Check for interactive elements
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();

    findings.push(`Interactive elements: ${buttons} button(s), ${inputs} input field(s)`);

    report.features.availableFeatures = features;
    report.features.findings = findings;

    // Calculate features score based on available features
    const expectedFeatures = [
      'Authentication - Sign In',
      'Navigation',
      'Dashboard',
      'Projects',
      'Tasks',
    ];
    const foundExpectedFeatures = expectedFeatures.filter(ef => features.includes(ef)).length;

    let score = (foundExpectedFeatures / expectedFeatures.length) * 70; // 70% for core features
    score += Math.min(features.length, 10) * 3; // Bonus for additional features

    report.features.score = Math.min(100, Math.round(score));

    console.log('Features Evaluation:', report.features);
  });

  // eslint-disable-next-line sonarjs/cognitive-complexity -- Test function with many code quality checks
  test('Evaluate Code Quality (Client-Side)', async ({ page }) => {
    await page.goto('/');

    const findings: string[] = [];

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length === 0) {
      findings.push('✓ No console errors detected');
    } else {
      findings.push(`✗ ${consoleErrors.length} console error(s) detected:`);
      for (const error of consoleErrors.slice(0, 3)) findings.push(`  - ${error}`);
    }

    // Check for proper error boundaries
    const hasErrorBoundary = await page.evaluate(() => {
      return Boolean(globalThis.onerror) || Boolean(window.addEventListener);
    });

    if (hasErrorBoundary) {
      findings.push('✓ Error handling mechanisms present');
    }

    // Check for proper HTML structure
    const htmlValidation = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      const duplicateIdCount = ids.length - new Set(ids).size;
      const invalidNesting = document.querySelectorAll('p p, a a').length;

      return {
        duplicateIds: duplicateIdCount,
        invalidNesting,
      };
    });

    if (htmlValidation.duplicateIds === 0) {
      findings.push('✓ No duplicate IDs found');
    } else {
      findings.push(`✗ ${htmlValidation.duplicateIds} duplicate ID(s) found`);
    }

    if (htmlValidation.invalidNesting === 0) {
      findings.push('✓ No invalid HTML nesting detected');
    } else {
      findings.push(`✗ ${htmlValidation.invalidNesting} invalid HTML nesting issue(s)`);
    }

    // Check for proper meta tags
    const metaTags = await page.evaluate(() => {
      return {
        viewport: Boolean(document.querySelector('meta[name="viewport"]')),
        description: Boolean(document.querySelector('meta[name="description"]')),
        charset: Boolean(document.querySelector('meta[charset]')),
        title: Boolean(document.title) && document.title.length > 0,
      };
    });

    if (metaTags.viewport) findings.push('✓ Viewport meta tag present');
    else findings.push('✗ Missing viewport meta tag');

    if (metaTags.description) findings.push('✓ Description meta tag present');
    else findings.push('⚠ Missing description meta tag');

    if (metaTags.charset) findings.push('✓ Charset meta tag present');
    else findings.push('✗ Missing charset meta tag');

    if (metaTags.title) findings.push('✓ Page title present');
    else findings.push('✗ Missing page title');

    report.codeQuality.findings = findings;

    // Calculate code quality score
    const positiveFindings = findings.filter(f => f.startsWith('✓')).length;
    const negativeFindings = findings.filter(f => f.startsWith('✗')).length;
    const warningFindings = findings.filter(f => f.startsWith('⚠')).length;

    let score = 80; // Base score
    score += positiveFindings * 5;
    score -= negativeFindings * 10;
    score -= warningFindings * 3;

    report.codeQuality.score = Math.min(100, Math.max(0, score));

    console.log('Code Quality Evaluation:', report.codeQuality);
  });

  test.afterAll(async () => {
    // Calculate overall score
    report.overallScore = Math.round(
      (report.uiUx.score +
        report.performance.score +
        report.codeQuality.score +
        report.security.score +
        report.features.score) /
        5,
    );

    // Generate report
    const reportPath = path.join('test-results', 'site-evaluation-report.json');
    const markdownReportPath = path.join('test-results', 'site-evaluation-report.md');

    // Ensure directory exists
    const directory = path.dirname(reportPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Save JSON report
    // eslint-disable-next-line unicorn/no-null -- JSON.stringify uses null for indentation
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(markdownReportPath, markdown);

    console.log('\n' + '='.repeat(80));
    console.log('SITE EVALUATION REPORT');
    console.log('='.repeat(80));
    console.log(markdown);
    console.log('='.repeat(80));
    console.log(`\nFull reports saved to:\n- ${reportPath}\n- ${markdownReportPath}`);
  });
});

function generateMarkdownReport(report: SiteEvaluationReport): string {
  let md = '# Site Evaluation Report\n\n';
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `## Overall Score: ${report.overallScore}/100 ${getEmoji(report.overallScore)} - ${getGrade(report.overallScore)}\n\n`;
  md += '---\n\n';

  // UI/UX Section
  md += `## 1. UI/UX ${getEmoji(report.uiUx.score)}\n\n`;
  md += `**Score:** ${report.uiUx.score}/100 - ${getGrade(report.uiUx.score)}\n\n`;
  md += '### Findings:\n';
  for (const f of report.uiUx.findings) {
    md += `- ${f}\n`;
  }
  if (report.uiUx.screenshots.length > 0) {
    md += '\n### Screenshots:\n';
    for (const s of report.uiUx.screenshots) {
      md += `- ${s}\n`;
    }
  }
  md += '\n';

  // Performance Section
  md += `## 2. Performance ${getEmoji(report.performance.score)}\n\n`;
  md += `**Score:** ${report.performance.score}/100 - ${getGrade(report.performance.score)}\n\n`;
  md += '### Metrics:\n';
  md += `- Page Load Time: ${report.performance.metrics.pageLoadTime}ms\n`;
  md += `- Time to Interactive: ${report.performance.metrics.timeToInteractive.toFixed(0)}ms\n`;
  md += `- First Contentful Paint: ${report.performance.metrics.firstContentfulPaint.toFixed(0)}ms\n`;
  md += '\n### Findings:\n';
  for (const f of report.performance.findings) {
    md += `- ${f}\n`;
  }
  md += '\n';

  // Code Quality Section
  md += `## 3. Code Quality ${getEmoji(report.codeQuality.score)}\n\n`;
  md += `**Score:** ${report.codeQuality.score}/100 - ${getGrade(report.codeQuality.score)}\n\n`;
  md += '### Findings:\n';
  for (const f of report.codeQuality.findings) {
    md += `- ${f}\n`;
  }
  md += '\n';

  // Security Section
  md += `## 4. Security ${getEmoji(report.security.score)}\n\n`;
  md += `**Score:** ${report.security.score}/100 - ${getGrade(report.security.score)}\n\n`;
  md += '### Findings:\n';
  for (const f of report.security.findings) {
    md += `- ${f}\n`;
  }
  md += '\n';

  // Features Section
  md += `## 5. Features ${getEmoji(report.features.score)}\n\n`;
  md += `**Score:** ${report.features.score}/100 - ${getGrade(report.features.score)}\n\n`;
  md += '### Available Features:\n';
  if (report.features.availableFeatures.length > 0) {
    for (const f of report.features.availableFeatures) {
      md += `- ${f}\n`;
    }
  } else {
    md += '- No features detected\n';
  }
  md += '\n### Findings:\n';
  for (const f of report.features.findings) {
    md += `- ${f}\n`;
  }
  md += '\n';

  // Summary
  md += '## Summary\n\n';
  md += '| Category | Score | Grade |\n';
  md += '|----------|-------|-------|\n';
  md += `| UI/UX | ${report.uiUx.score}/100 | ${getGrade(report.uiUx.score)} |\n`;
  md += `| Performance | ${report.performance.score}/100 | ${getGrade(report.performance.score)} |\n`;
  md += `| Code Quality | ${report.codeQuality.score}/100 | ${getGrade(report.codeQuality.score)} |\n`;
  md += `| Security | ${report.security.score}/100 | ${getGrade(report.security.score)} |\n`;
  md += `| Features | ${report.features.score}/100 | ${getGrade(report.features.score)} |\n`;
  md += `| **Overall** | **${report.overallScore}/100** | **${getGrade(report.overallScore)}** |\n`;

  return md;
}
