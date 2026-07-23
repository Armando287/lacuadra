const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matches';");
  console.log(res.rows);
  await client.end();
}
check();
