-- ============================================
-- INCIDENT REPORTING SYSTEM
-- Mock data-focused schema for demonstration
-- ============================================

-- Equipment/racking locations for QR codes
CREATE TABLE IF NOT EXISTS equipment_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT NOT NULL,
  location_code TEXT NOT NULL,           -- e.g., "Z3-R12"
  location_name TEXT NOT NULL,           -- e.g., "Conveyor Belt Z3-R12"
  zone TEXT,                             -- e.g., "Zone 3"
  equipment_type TEXT,                   -- e.g., "Conveyor", "HVAC", "Packing Station"
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_code, location_code)
);

-- Pre-seeded incident photos per location
CREATE TABLE IF NOT EXISTS location_incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES equipment_locations(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  incident_category TEXT NOT NULL,       -- 'conveyor_jam', 'wet_floor', 'pest', 'equipment', 'false_positive'
  expected_severity INT CHECK (expected_severity BETWEEN 1 AND 5),
  is_false_positive BOOLEAN DEFAULT FALSE,
  is_ambiguous BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  description TEXT,                      -- What the photo shows
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main incident reports table (enhanced from existing incidents table)
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT NOT NULL,
  location_id UUID REFERENCES equipment_locations(id),
  location_code TEXT,                     -- Denormalized for display
  location_name TEXT,                     -- Denormalized for display

  -- Reporter info
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),

  -- Photo selection (reference to pre-seeded photos)
  selected_photo_ids JSONB NOT NULL,      -- Array of photo IDs selected

  -- AI Analysis Results
  ai_analysis JSONB,                      -- Full Gemini response
  incident_type TEXT,                     -- 'Equipment', 'Safety', 'Pest', 'Environmental', etc.
  severity INT CHECK (severity BETWEEN 1 AND 5),
  ai_classification TEXT,                 -- 'real_incident', 'false_positive', 'ambiguous'
  ai_confidence INT CHECK (ai_confidence BETWEEN 0 AND 100),
  ai_description TEXT,
  ai_suggested_action TEXT,

  -- Routing (based on severity)
  routed_to TEXT,                         -- 'Safety Team', 'Maintenance', 'Log Only'
  routing_reason TEXT,

  -- Status workflow
  status TEXT DEFAULT 'pending_review',   -- 'pending_review', 'in_review', 'approved', 'rejected', 'resolved'

  -- Timestamps for workflow
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review queue specifically for incident photos
CREATE TABLE IF NOT EXISTS incident_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT NOT NULL,
  incident_id UUID REFERENCES incident_reports(id) ON DELETE CASCADE,

  -- Why it needs review
  review_reason TEXT NOT NULL,            -- 'high_severity', 'ambiguous', 'low_confidence', 'false_positive_check'
  priority INT DEFAULT 3,                 -- 1=highest, 5=lowest

  -- Review status
  status TEXT DEFAULT 'pending',          -- 'pending', 'in_progress', 'completed'
  assigned_to TEXT,

  -- Decision
  decision TEXT,                          -- 'approve', 'reject', 'escalate', 'request_info'
  decision_by TEXT,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approved incidents go here for permanent record
CREATE TABLE IF NOT EXISTS incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT NOT NULL,
  original_incident_id UUID,              -- Reference to original report

  -- Snapshot of incident data
  location_code TEXT NOT NULL,
  location_name TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity INT NOT NULL,
  description TEXT NOT NULL,
  photos JSONB NOT NULL,

  -- Reporter & reviewer info
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW(),

  -- Resolution tracking
  status TEXT DEFAULT 'open',             -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- Analytics
  time_to_review_minutes INT,
  time_to_resolution_minutes INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_incident_reports_session ON incident_reports(session_code);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports(severity DESC);
CREATE INDEX IF NOT EXISTS idx_incident_review_queue_session ON incident_review_queue(session_code);
CREATE INDEX IF NOT EXISTS idx_incident_review_queue_status ON incident_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_incident_history_session ON incident_history(session_code);
CREATE INDEX IF NOT EXISTS idx_equipment_locations_session ON equipment_locations(session_code);
CREATE INDEX IF NOT EXISTS idx_location_incident_photos_location ON location_incident_photos(location_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- Can enable if needed for multi-tenant security
-- ============================================

-- ALTER TABLE equipment_locations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE location_incident_photos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incident_review_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incident_history ENABLE ROW LEVEL SECURITY;

-- Public read access for demo purposes (adjust as needed)
-- CREATE POLICY "Public read access" ON equipment_locations FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON location_incident_photos FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON incident_reports FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON incident_review_queue FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON incident_history FOR SELECT USING (true);

-- ============================================
-- ENABLE REALTIME FOR KEY TABLES
-- ============================================

-- Enable realtime subscriptions for live updates
-- Run this separately in Supabase dashboard if using realtime:
-- ALTER PUBLICATION supabase_realtime ADD TABLE incident_reports;
-- ALTER PUBLICATION supabase_realtime ADD TABLE incident_review_queue;
-- ALTER PUBLICATION supabase_realtime ADD TABLE incident_history;
