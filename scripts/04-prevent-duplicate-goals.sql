-- Migration to prevent duplicate goals at database level
-- Add a unique constraint based on user_id, title, and description

-- First, clean up any existing duplicates
WITH ranked_goals AS (
  SELECT id,
         user_id,
         title,
         description,
         created_at,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, LOWER(TRIM(title)), LOWER(TRIM(COALESCE(description, '')))
           ORDER BY created_at ASC
         ) as rn
  FROM goals
)
DELETE FROM goals
WHERE id IN (
  SELECT id
  FROM ranked_goals
  WHERE rn > 1
);

-- Create a function to generate goal signature (similar to frontend)
CREATE OR REPLACE FUNCTION generate_goal_signature(
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_timeline TEXT DEFAULT '',
  p_milestone_count INTEGER DEFAULT 0
) RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(p_title)) || '|' ||
         LOWER(TRIM(COALESCE(p_description, ''))) || '|' ||
         LOWER(TRIM(COALESCE(p_timeline, ''))) || '|' ||
         p_milestone_count::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a computed column for goal signature
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_signature TEXT;

-- Update existing goals with their signatures
UPDATE goals SET goal_signature = generate_goal_signature(
  title,
  description,
  timeline,
  (SELECT COUNT(*) FROM milestones WHERE goal_id = goals.id)
);

-- Create a unique constraint on user_id and goal_signature
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_unique_signature
ON goals(user_id, goal_signature);

-- Create a trigger to automatically update goal_signature on insert/update
CREATE OR REPLACE FUNCTION update_goal_signature()
RETURNS TRIGGER AS $$
BEGIN
  -- Get milestone count
  DECLARE
    milestone_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO milestone_count
    FROM milestones
    WHERE goal_id = NEW.id;

    NEW.goal_signature := generate_goal_signature(
      NEW.title,
      NEW.description,
      NEW.timeline,
      milestone_count
    );

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_goal_signature ON goals;
CREATE TRIGGER trigger_update_goal_signature
  BEFORE INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_signature();

-- Also create a trigger for when milestones change (affects signature)
CREATE OR REPLACE FUNCTION update_goal_signature_on_milestone_change()
RETURNS TRIGGER AS $$
DECLARE
  goal_record RECORD;
  milestone_count INTEGER;
BEGIN
  -- Get the goal ID
  DECLARE
    target_goal_id UUID;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      target_goal_id := OLD.goal_id;
    ELSE
      target_goal_id := NEW.goal_id;
    END IF;

    -- Count milestones for this goal
    SELECT COUNT(*) INTO milestone_count
    FROM milestones
    WHERE goal_id = target_goal_id;

    -- Update the goal's signature
    UPDATE goals
    SET goal_signature = generate_goal_signature(
      title,
      description,
      timeline,
      milestone_count
    )
    WHERE id = target_goal_id;

    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goal_signature_on_milestone_change ON milestones;
CREATE TRIGGER trigger_update_goal_signature_on_milestone_change
  AFTER INSERT OR UPDATE OR DELETE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_signature_on_milestone_change();

-- Add comment for documentation
COMMENT ON INDEX idx_goals_unique_signature IS 'Prevents duplicate goals based on content signature';
COMMENT ON FUNCTION generate_goal_signature IS 'Generates unique signature for goal content to prevent duplicates';
COMMENT ON FUNCTION update_goal_signature IS 'Updates goal signature when goal data changes';
COMMENT ON FUNCTION update_goal_signature_on_milestone_change IS 'Updates goal signature when milestones change';
