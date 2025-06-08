-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_goals_with_stats(uuid);
DROP FUNCTION IF EXISTS update_goal_progress(uuid);
DROP FUNCTION IF EXISTS trigger_update_goal_progress();

-- Function to get user's goals with milestone counts
CREATE OR REPLACE FUNCTION get_user_goals_with_stats(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  timeline TEXT,
  progress INTEGER,
  status TEXT,
  due_date DATE,
  sub_goals JSONB,
  completed_sub_goals INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_milestones BIGINT,
  completed_milestones BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.description,
    g.timeline,
    g.progress,
    g.status,
    g.due_date,
    g.sub_goals,
    g.completed_sub_goals,
    g.created_at,
    g.updated_at,
    COUNT(m.id) as total_milestones,
    COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones
  FROM goals g
  LEFT JOIN milestones m ON g.id = m.goal_id
  WHERE g.user_id = user_uuid
  GROUP BY g.id, g.title, g.description, g.timeline, g.progress, g.status,
           g.due_date, g.sub_goals, g.completed_sub_goals, g.created_at, g.updated_at
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update goal progress based on milestones
CREATE OR REPLACE FUNCTION update_goal_progress(goal_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_milestones INTEGER;
  completed_milestones INTEGER;
  new_progress INTEGER;
  new_status TEXT;
BEGIN
  -- Count total and completed milestones
  SELECT
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO total_milestones, completed_milestones
  FROM milestones
  WHERE goal_id = goal_uuid;

  -- Calculate new progress
  IF total_milestones > 0 THEN
    new_progress := ROUND((completed_milestones::DECIMAL / total_milestones) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Determine new status
  IF new_progress = 100 THEN
    new_status := 'completed';
  ELSIF new_progress >= 75 THEN
    new_status := 'on-track';
  ELSIF new_progress >= 25 THEN
    new_status := 'in-progress';
  ELSE
    new_status := 'behind';
  END IF;

  -- Update the goal
  UPDATE goals
  SET
    progress = new_progress,
    status = new_status,
    completed_sub_goals = completed_milestones,
    updated_at = NOW()
  WHERE id = goal_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update goal progress when milestones change
CREATE OR REPLACE FUNCTION trigger_update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for the affected goal
  IF TG_OP = 'DELETE' THEN
    PERFORM update_goal_progress(OLD.goal_id);
    RETURN OLD;
  ELSE
    PERFORM update_goal_progress(NEW.goal_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for milestone changes
DROP TRIGGER IF EXISTS milestone_progress_trigger ON milestones;
CREATE TRIGGER milestone_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_goal_progress();
