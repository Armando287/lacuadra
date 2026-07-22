const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('apf_page.html', 'utf-8');
const $ = cheerio.load(html);

// Intentar encontrar las jornadas
const matches = [];

// Busquemos en la página todos los equipos. Podrían tener alguna clase específica.
// O busquemos textos como 'Olimpia', 'Cerro', etc.
$('*').each((i, el) => {
  const text = $(el).text();
  if (text.includes('Olimpia') && text.includes('Cerro') && text.length < 200) {
    console.log("Posible contenedor: ", $(el).html());
  }
});

// Extraigamos todos los links o img para ver si hay logos de clubes
$('img').each((i, el) => {
    // console.log($(el).attr('src'), $(el).attr('alt'));
});

// A ver si hay algo con clase match, partido, list, etc.
$('[class*="match"]').each((i, el) => {
    // console.log("Match class found");
});
