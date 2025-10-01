-- Migration: Create discovered_places table
-- This table stores places discovered through the ChatGPT API

CREATE TABLE IF NOT EXISTS discovered_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    why_interesting TEXT,
    category TEXT,
    location TEXT,
    estimated_visit_duration TEXT,
    best_time_to_visit TEXT,
    practical_tips TEXT,
    latitude REAL,
    longitude REAL,
    region TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discovered_places_region ON discovered_places(region);
CREATE INDEX IF NOT EXISTS idx_discovered_places_category ON discovered_places(category);
CREATE INDEX IF NOT EXISTS idx_discovered_places_coordinates ON discovered_places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_discovered_places_name ON discovered_places(name);