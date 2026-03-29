const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PageError:', error.message);
  });

  await page.goto('http://localhost:5173/calendar', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
