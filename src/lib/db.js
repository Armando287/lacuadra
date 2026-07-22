import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.json');

export function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading DB:", error);
    return { users: [], matches: [], votes: [] };
  }
}

export function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Error writing DB:", error);
    return false;
  }
}
