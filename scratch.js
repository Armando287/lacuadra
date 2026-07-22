const fs = require('fs');
try {
  fs.rmSync('src/app/stats', { recursive: true, force: true });
  fs.rmSync('src/app/api/stats', { recursive: true, force: true });
  console.log("Stats removed.");
} catch(e) {
  console.error(e);
}
