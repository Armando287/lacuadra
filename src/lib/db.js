import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.json');

export function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(data);
    if (!db.friendships) db.friendships = [];
    return db;
  } catch (error) {
    console.error("Error reading DB:", error);
    return { users: [], matches: [], votes: [], friendships: [] };
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
