-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view their own goals" 
  ON goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
  ON goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
  ON goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
  ON goals FOR DELETE 
  USING (auth.uid() = user_id);

-- Milestones policies
CREATE POLICY "Users can view milestones for their goals" 
  ON milestones FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones for their goals" 
  ON milestones FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones for their goals" 
  ON milestones FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones for their goals" 
  ON milestones FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );
