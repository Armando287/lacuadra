const data = require('./apf_data.json');
const str = JSON.stringify(data);
const regex = /"home_team_name":"([^"]+)","away_team_name":"([^"]+)".+?"home_score":(\d+|null),"away_score":(\d+|null)/g;
let match;
const results = [];
while ((match = regex.exec(str)) !== null) {
  results.push(match[0]);
}
console.log(results.slice(0, 5));
