-- Review Decisions table
-- Stores human decisions made on flagged items from the review queue

CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code CHAR(6) NOT NULL,
  item_type TEXT NOT NULL,  -- 'discrepancy', 'confidence_check', 'escalation'
  item_id TEXT NOT NULL,
  decision TEXT NOT NULL,   -- 'approved', 'rejected', 'escalated'
  decided_by TEXT NOT NULL,
  comment TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_review_decisions_session ON review_decisions(session_code);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE review_decisions;
