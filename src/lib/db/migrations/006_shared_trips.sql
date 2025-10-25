-- Shared trips table for shareable flight links
CREATE TABLE IF NOT EXISTS shared_trips (
  id SERIAL PRIMARY KEY,
  share_code VARCHAR(8) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  trip_name VARCHAR(255),
  flight_ids JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  views INTEGER DEFAULT 0
);

-- Index for faster lookups
CREATE INDEX idx_shared_trips_share_code ON shared_trips(share_code);
CREATE INDEX idx_shared_trips_user_id ON shared_trips(user_id);
CREATE INDEX idx_shared_trips_expires_at ON shared_trips(expires_at);
