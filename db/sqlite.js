import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

class SQLite {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await open({
      filename: './users.db',
      driver: sqlite3.Database,
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        feedback TEXT NOT NULL
      );
    `);
  }

  async insertFeedback(feedback) {
    if (!this.db) {
      throw new Error('Database not initialized.');
    }
    await this.db.run('INSERT INTO users (feedback) VALUES (?)', feedback);
  }
}

const db = new SQLite();

async function initializeDatabase() {
  await db.init();
  console.log('Database initialized successfully.');
}

initializeDatabase().catch(error => {
  console.error('Error initializing database:', error);
});

export default db;
