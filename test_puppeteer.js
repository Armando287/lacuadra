const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  
  // Interceptar requests
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api')) {
      console.log(`[API CALL] ${url}`);
    }
  });

  console.log("Navigating...");
  await page.goto('https://www.apf.org.py/partidos-clausura', { waitUntil: 'networkidle0' });
  console.log("Done");
  await browser.close();
})();
