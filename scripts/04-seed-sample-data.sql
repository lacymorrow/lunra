-- This script will only run if there's a logged-in user
-- It creates sample data for testing the database structure

-- Note: This will only work when there's an authenticated user
-- The auth.uid() function returns the current user's ID

DO $$
DECLARE
  current_user_id UUID;
  sample_goal_id UUID;
BEGIN
  -- Get current user ID (will be null if not authenticated)
  current_user_id := auth.uid();
  
  -- Only proceed if user is authenticated
  IF current_user_id IS NOT NULL THEN
    
    -- Insert a sample goal
    INSERT INTO goals (
      user_id,
      title,
      description,
      timeline,
      progress,
      status,
      due_date,
      sub_goals,
      completed_sub_goals
    ) VALUES (
      current_user_id,
      'Launch my own business',
      'Start a tech company focused on productivity tools',
      '12 months',
      25,
      'in-progress',
      CURRENT_DATE + INTERVAL '12 months',
      '["Market research & validation", "Business plan development", "Legal setup & registration", "Brand identity & website", "Product development", "Initial funding", "Customer acquisition", "Team hiring"]'::jsonb,
      2
    ) RETURNING id INTO sample_goal_id;
    
    -- Insert sample milestones for the goal
    INSERT INTO milestones (goal_id, week, task, status, progress) VALUES
      (sample_goal_id, 1, 'Market research & validation', 'completed', 100),
      (sample_goal_id, 2, 'Business plan development', 'completed', 100),
      (sample_goal_id, 3, 'Legal setup & registration', 'in-progress', 60),
      (sample_goal_id, 4, 'Brand identity & website', 'pending', 0),
      (sample_goal_id, 5, 'Product development', 'pending', 0),
      (sample_goal_id, 6, 'Initial funding', 'pending', 0),
      (sample_goal_id, 7, 'Customer acquisition', 'pending', 0),
      (sample_goal_id, 8, 'Team hiring', 'pending', 0);
    
    -- Insert another sample goal
    INSERT INTO goals (
      user_id,
      title,
      description,
      timeline,
      progress,
      status,
      due_date,
      sub_goals,
      completed_sub_goals
    ) VALUES (
      current_user_id,
      'Get in better shape',
      'Improve overall fitness and health',
      '6 months',
      60,
      'on-track',
      CURRENT_DATE + INTERVAL '6 months',
      '["Establish workout routine", "Nutrition plan implementation", "First fitness assessment", "Increase workout intensity", "Mid-point fitness test"]'::jsonb,
      3
    );
    
    RAISE NOTICE 'Sample data created successfully for user %', current_user_id;
    
  ELSE
    RAISE NOTICE 'No authenticated user found. Sample data not created.';
  END IF;
END $$;
