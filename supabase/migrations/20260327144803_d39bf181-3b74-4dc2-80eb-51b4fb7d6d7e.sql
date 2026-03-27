UPDATE speakers 
SET biography = REPLACE(REPLACE(biography, '<b>', '<strong>'), '</b>', '</strong>'),
    updated_at = now()
WHERE biography LIKE '%<b>%';