const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  
  console.log("Navigating...");
  await page.goto('https://www.apf.org.py/partidos-clausura', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  fs.writeFileSync('rendered_apf.html', content);
  
  console.log("Saved rendered HTML");
  await browser.close();
})();
