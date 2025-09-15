CREATE TABLE IF NOT EXISTS app_user (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app_user(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app_user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  source TEXT,
  external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES app_user(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  source TEXT,
  snippet TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
