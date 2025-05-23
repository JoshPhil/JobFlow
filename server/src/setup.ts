import db from './db';

async function setupDatabase() {
  try {
    // USERS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // JOBS table
    await db.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'wishlist',
        job_posting_url TEXT,
        applied_at DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tables created successfully.');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    db.end(); // Close the DB pool
  }
}

setupDatabase();
