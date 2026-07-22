const fs = require('fs');
const data = require('./apf_data.json');

function findMatches(obj) {
  let results = [];
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && item.home_team_name && item.away_team_name) {
        results.push(item);
      } else {
        results = results.concat(findMatches(item));
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj[key] && obj[key].home_team_name && obj[key].away_team_name) {
         results.push(obj[key]);
      } else {
         results = results.concat(findMatches(obj[key]));
      }
    }
  }
  return results;
}

const allMatches = findMatches(data);
console.log(`Found ${allMatches.length} matches.`);
if (allMatches.length > 0) {
  console.log(allMatches[0]);
}
