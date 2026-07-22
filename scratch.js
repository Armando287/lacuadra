// Using native fetch

async function testApi() {
  const API_KEY = "915045296b22ddbced36e77ac52f3221";
  const BASE_URL = 'https://v3.football.api-sports.io';
  
  try {
    const res = await fetch(`${BASE_URL}/fixtures?league=252&season=2026`, {
      headers: {
        'x-apisports-key': API_KEY
      }
    });
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
testApi();
