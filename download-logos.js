const fs = require('fs');
const path = require('path');
const https = require('https');

const TEAMS = {
  '2 de Mayo': 'begec',
  'Rubio Ñú': 'ihhe',
  'Cerro Porteño': 'bcje',
  'Cerro': 'bcje',
  'Sportivo Trinidense': 'begea',
  'Recoleta FC': 'fdcaj',
  'Recoleta': 'fdcaj',
  'CS San Lorenzo': 'begde',
  'San Lorenzo': 'begde',
  'Sportivo Ameliano': 'fgfii',
  'Club Nacional': 'bcia',
  'Nacional': 'bcia',
  'Olimpia': 'ifei',
  'Libertad': 'bcig',
  'Club Guaraní': 'hhdj',
  'Guaraní': 'hhdj',
  'Sportivo Luqueño': 'ihhi',
};

const outputDir = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.promiedos.com.ar/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Status ${response.statusCode} for ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadAll() {
  const uniqueIds = [...new Set(Object.values(TEAMS))];
  
  for (const id of uniqueIds) {
    const url = `https://api.promiedos.com.ar/images/team/${id}/1`;
    const dest = path.join(outputDir, `${id}.png`);
    
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`✓ ${id} already downloaded`);
      continue;
    }
    
    try {
      await downloadImage(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`✅ Downloaded ${id} (${size} bytes)`);
    } catch (err) {
      console.error(`❌ Failed ${id}: ${err.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n✅ All logos downloaded!');
}

downloadAll();
