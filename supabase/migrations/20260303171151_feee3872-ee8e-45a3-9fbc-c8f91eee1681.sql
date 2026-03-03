-- Fix conferences where title starts with "Conférence" and contains the description text
-- Move the content to description and set title to "Conférence"
UPDATE speaker_conferences
SET 
  description = CASE 
    WHEN description IS NULL OR description = '' OR description LIKE '%' || substring(title from 12) || '%'
    THEN '<p>' || substring(title from 12) || '</p>'
    ELSE description
  END,
  title = 'Conférence'
WHERE title LIKE 'Conférence%' AND LENGTH(title) > 30;

-- Also fix "Conférences" prefix (plural)
UPDATE speaker_conferences
SET 
  description = CASE 
    WHEN description IS NULL OR description = '' OR description LIKE '%' || substring(title from 13) || '%'
    THEN '<p>' || substring(title from 13) || '</p>'
    ELSE description
  END,
  title = 'Conférences'
WHERE title LIKE 'Conférences%' AND LENGTH(title) > 30;