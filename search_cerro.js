const data = require('./apf_data.json');
const str = JSON.stringify(data);
const regex = /.{0,50}Cerro Porteño.{0,50}/g;
let match;
const results = [];
while ((match = regex.exec(str)) !== null) {
  results.push(match[0]);
}
console.log(results.slice(0, 5));
