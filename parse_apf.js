const fs = require('fs');

const html = fs.readFileSync('apf_page.html', 'utf-8');
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);

if (match) {
  fs.writeFileSync('apf_data.json', match[1]);
  console.log('Saved data to apf_data.json');
} else {
  console.log('No __NEXT_DATA__ found');
}
