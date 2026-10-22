import 'dotenv/config'
import { pool } from './pool.js'

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(254) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(80),
      bio VARCHAR(500) NOT NULL DEFAULT '',
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(80);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500) NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    CREATE TABLE IF NOT EXISTS stories (
      id SERIAL PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      share_token VARCHAR(64) UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE stories ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE stories ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
    CREATE TABLE IF NOT EXISTS contributors (
      id SERIAL PRIMARY KEY,
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (story_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content VARCHAR(1000) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS comment_reactions (
      comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reaction VARCHAR(20) NOT NULL DEFAULT 'like',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (comment_id, user_id, reaction)
    );
    CREATE TABLE IF NOT EXISTS story_versions (
      id SERIAL PRIMARY KEY,
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      title VARCHAR(180) NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  console.log('Database tables are ready.')
} catch (error) {
  console.error('Could not initialize database tables.', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
