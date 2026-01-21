-- Challenge Sessions Table for Lobby System
-- Allows presenter to control when challenges start so all participants begin at the same time

CREATE TABLE IF NOT EXISTS challenge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code char(6) NOT NULL,
  challenge_type text NOT NULL, -- 'billing', 'reconciliation', etc.
  node_label text, -- optional: specific node this challenge is for
  status text NOT NULL DEFAULT 'lobby', -- 'lobby', 'active', 'finished'
  started_at timestamptz, -- when the challenge was started
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_code, challenge_type, node_label)
);

-- Enable RLS
ALTER TABLE challenge_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for demo purposes
CREATE POLICY IF NOT EXISTS "Allow anonymous access to challenge_sessions"
  ON challenge_sessions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Session Participants Table for Calibration Slide
-- Tracks who has joined a session

CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code char(6) NOT NULL,
  participant_name text NOT NULL,
  node_name text, -- which node they joined from
  joined_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for demo purposes
CREATE POLICY IF NOT EXISTS "Allow anonymous access to session_participants"
  ON session_participants FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
