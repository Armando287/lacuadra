const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('rendered_apf.html', 'utf-8');
const $ = cheerio.load(html);

const results = [];
$('*').each((i, el) => {
  const text = $(el).text();
  if (text.includes('Olimpia') && text.includes('Cerro') && text.length < 200) {
    results.push($(el).html());
  }
});
console.log(`Found ${results.length} elements containing both Olimpia and Cerro.`);

// Check for links or standard class names
$('[class*="match"]').each((i, el) => {
    // console.log("Match class found");
});

console.log("First 500 chars of HTML:");
console.log(html.substring(0, 500));
