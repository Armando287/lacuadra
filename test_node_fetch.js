const https = require('https');

const options = {
  hostname: 'api.sofascore.com',
  path: '/api/v1/unique-tournament/192',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.sofascore.com',
    'Referer': 'https://www.sofascore.com/',
    'Cache-Control': 'no-cache'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    if(res.statusCode === 200) {
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', e => console.error(e));
req.end();
