const cheerio = require('cheerio');

async function scrapeGoogle() {
  const res = await fetch('https://www.google.com/search?q=paraguay+primera+division+resultados&hl=es', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // En Google Sports, los partidos suelen estar en tablas o divs con clases específicas
  // Vamos a buscar textos como "Cerro Porteño", "Olimpia"
  const matches = [];
  $('div').each((i, el) => {
    const text = $(el).text();
    if (text.includes('Olimpia') && text.length < 150) {
      matches.push(text);
    }
  });
  
  console.log(`Found ${matches.length} elements containing Olimpia.`);
  console.log(matches.slice(0, 5));
}

scrapeGoogle();
