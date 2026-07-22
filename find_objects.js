const fs = require('fs');
const data = require('./apf_data.json');

function findObjects(obj) {
  let results = [];
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && item.shortName) {
        results.push(item);
      } else {
        results = results.concat(findObjects(item));
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj[key] && obj[key].shortName) {
         results.push(obj[key]);
      } else {
         results = results.concat(findObjects(obj[key]));
      }
    }
  }
  return results;
}

const items = findObjects(data);
console.log(`Found ${items.length} items with shortName.`);
if (items.length > 0) {
  console.log(items[0]);
}
