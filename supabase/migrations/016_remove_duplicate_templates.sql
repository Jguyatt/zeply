-- Remove duplicate deliverable templates
-- Keeps the oldest template for each unique name

DELETE FROM deliverable_templates
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(name)) id
  FROM deliverable_templates
  ORDER BY LOWER(name), created_at ASC
);

-- Also clean up orphaned template items
DELETE FROM deliverable_template_items
WHERE template_id NOT IN (SELECT id FROM deliverable_templates);

