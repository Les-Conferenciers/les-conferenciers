UPDATE public.speakers 
SET biography = REGEXP_REPLACE(
  biography, 
  '<img[^>]*claude-onesta[^>]*/?>',
  '',
  'gi'
)
WHERE slug = 'claude-onesta'