UPDATE speaker_conferences 
SET description = REPLACE(REPLACE(description, '<b>', '<strong>'), '</b>', '</strong>')
WHERE description LIKE '%<b>%';