-- Price tracking table
CREATE TABLE IF NOT EXISTS price_tracking (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  max_price DECIMAL(10, 2),
  alert_email VARCHAR(255),
  initial_price DECIMAL(10, 2),
  current_price DECIMAL(10, 2),
  lowest_price DECIMAL(10, 2),
  last_checked TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, flight_id)
);

-- Price alerts history
CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  price_drop_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN old_price > 0 THEN ((old_price - new_price) / old_price * 100)
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_price_tracking_user_id ON price_tracking(user_id);
CREATE INDEX idx_price_tracking_flight_id ON price_tracking(flight_id);
CREATE INDEX idx_price_tracking_active ON price_tracking(is_active) WHERE is_active = true;
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_created_at ON price_alerts(created_at DESC);
