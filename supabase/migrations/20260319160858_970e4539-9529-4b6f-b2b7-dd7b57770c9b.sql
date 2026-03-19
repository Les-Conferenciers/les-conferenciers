-- Fix remaining HTML entities in reviews (&#8211;, &rsquo;, &ndash;, etc.)
UPDATE public.reviews 
SET comment = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(comment, '&#8211;', E'\u2013'),
                    '&#8212;', E'\u2014'),
                  '&#8217;', E'\u2019'),
                '&#8216;', E'\u2018'),
              '&#8220;', E'\u201C'),
            '&#8221;', E'\u201D'),
          '&rsquo;', E'\u2019'),
        '&lsquo;', E'\u2018'),
      '&rdquo;', E'\u201D'),
    '&ldquo;', E'\u201C'),
  '&ndash;', E'\u2013'),
'&mdash;', E'\u2014')
WHERE comment LIKE '%&%' OR comment LIKE '%&#%';

-- Also clean speaker_conferences descriptions from markdown ** artifacts
UPDATE public.speaker_conferences
SET description = REPLACE(description, '**', '')
WHERE description LIKE '%**%';

-- Also clean reviews author_name and author_title
UPDATE public.reviews 
SET author_name = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(author_name, '&#8211;', E'\u2013'),
    '&rsquo;', E'\u2019'),
  '&#8217;', E'\u2019'),
'&amp;', '&')
WHERE author_name LIKE '%&%';

UPDATE public.reviews 
SET author_title = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(author_title, '&#8211;', E'\u2013'),
    '&rsquo;', E'\u2019'),
  '&#8217;', E'\u2019'),
'&amp;', '&')
WHERE author_title IS NOT NULL AND author_title LIKE '%&%';