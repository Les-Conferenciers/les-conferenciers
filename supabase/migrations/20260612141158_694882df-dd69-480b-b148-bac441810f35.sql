UPDATE public.email_templates
SET body_html = btrim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(body_html, '<br\s*/?>', E'\n', 'gi'),
            '</p\s*>', E'\n\n', 'gi'
          ),
          '</(div|h[1-6]|li)\s*>', E'\n', 'gi'
        ),
        '<li[^>]*>', '• ', 'gi'
      ),
      '<[^>]+>', '', 'g'
    ),
    E'\n{3,}', E'\n\n', 'g'
  )
)
WHERE format = 'plain'
  AND body_html ~ '<[^>]+>';