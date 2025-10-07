-- Add new event types for speed skating competitions
-- Short Track Speed events
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'speed_short_track_500m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'speed_short_track_1000m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'speed_short_track_1500m';

-- Short Track Relay events
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'relay_5000m_men';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'relay_3000m_women';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'relay_mixed';

-- Long Track Speed events
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'speed_200m_time_trial';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'speed_group_500m_distance';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'speed_group_1000m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'points_race_5000m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'elimination_10000m';

-- Road events
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_100m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_500m_distance';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_1000m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_5000m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_10000m';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_15000m_elimination';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'road_marathon_42km';

-- Ensure competition_results table has event_type column
ALTER TABLE competition_results 
ADD COLUMN IF NOT EXISTS event_type event_type;