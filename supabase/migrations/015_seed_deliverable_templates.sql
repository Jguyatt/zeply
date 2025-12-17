-- Seed Default Deliverable Templates
-- Creates 7 agency-focused templates with predefined checklist items
-- Only inserts if templates don't already exist

DO $$
DECLARE
  strategy_template_id UUID;
  setup_template_id UUID;
  creative_template_id UUID;
  landing_template_id UUID;
  report_template_id UUID;
  automation_template_id UUID;
  integration_template_id UUID;
BEGIN
  -- Check if templates already exist, if so skip seeding
  IF EXISTS (SELECT 1 FROM deliverable_templates LIMIT 1) THEN
    RETURN;
  END IF;

  -- Strategy / Plan Template
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Strategy / Plan',
    'Report',
    'Onboarding doc, roadmap, or audit delivered to clients',
    '["file", "loom"]'::jsonb
  ) RETURNING id INTO strategy_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (strategy_template_id, 'Kickoff', 1, true),
    (strategy_template_id, 'Requirements', 2, true),
    (strategy_template_id, 'Plan', 3, true),
    (strategy_template_id, 'Sign-off', 4, true);

  -- Setup / Configuration Template
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Setup / Configuration',
    'Automation',
    'Tracking setup, analytics, CRM, or n8n environment configuration',
    '["screenshot", "file"]'::jsonb
  ) RETURNING id INTO setup_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (setup_template_id, 'Configuration', 1, true),
    (setup_template_id, 'Testing', 2, true),
    (setup_template_id, 'Documentation', 3, true),
    (setup_template_id, 'Handoff', 4, true);

  -- Creative Template
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Creative',
    'Creative',
    'Design assets, graphics, or video content for campaigns',
    '["file", "screenshot"]'::jsonb
  ) RETURNING id INTO creative_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (creative_template_id, 'Concept', 1, true),
    (creative_template_id, 'Design', 2, true),
    (creative_template_id, 'Review', 3, true),
    (creative_template_id, 'Final', 4, true);

  -- Landing Page Template
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Landing Page',
    'Web',
    'Conversion-focused landing page with optimized design',
    '["url", "screenshot"]'::jsonb
  ) RETURNING id INTO landing_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (landing_template_id, 'Wireframe', 1, true),
    (landing_template_id, 'Copy', 2, true),
    (landing_template_id, 'Build', 3, true),
    (landing_template_id, 'QA', 4, true),
    (landing_template_id, 'Publish', 5, true);

  -- Report Template
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Report',
    'Report',
    'Performance reports, analytics summaries, or campaign insights',
    '["url", "file"]'::jsonb
  ) RETURNING id INTO report_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (report_template_id, 'Data Collection', 1, true),
    (report_template_id, 'Analysis', 2, true),
    (report_template_id, 'Design', 3, true),
    (report_template_id, 'Review', 4, true),
    (report_template_id, 'Publish', 5, true);

  -- Automation / Workflow Template (n8n-focused)
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Automation / Workflow',
    'Automation',
    'n8n workflow automation with monitoring and client handoff',
    '["file", "loom", "url"]'::jsonb
  ) RETURNING id INTO automation_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (automation_template_id, 'Design', 1, true),
    (automation_template_id, 'Build', 2, true),
    (automation_template_id, 'Test', 3, true),
    (automation_template_id, 'Deploy', 4, true),
    (automation_template_id, 'Monitoring Enabled', 5, true),
    (automation_template_id, 'Documentation', 6, true);

  -- Integration Template (Advanced)
  INSERT INTO deliverable_templates (name, type, description, required_proof_types)
  VALUES (
    'Integration (Advanced)',
    'Automation',
    'Complex system integrations or API connections',
    '["url", "file"]'::jsonb
  ) RETURNING id INTO integration_template_id;

  INSERT INTO deliverable_template_items (template_id, title, sort_order, is_required)
  VALUES
    (integration_template_id, 'Plan', 1, true),
    (integration_template_id, 'Build', 2, true),
    (integration_template_id, 'Test', 3, true),
    (integration_template_id, 'Deploy', 4, true),
    (integration_template_id, 'Documentation', 5, true);
END $$;


