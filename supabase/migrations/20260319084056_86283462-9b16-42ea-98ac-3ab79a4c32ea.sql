UPDATE public.reviews 
SET comment = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(comment, '&rsquo;', E'\u2019'),
              '&#8230;', E'\u2026'),
            '&#8230', E'\u2026'),
          '&eacute;', E'\u00E9'),
        '&egrave;', E'\u00E8'),
      '&amp;', '&'),
    '&lsquo;', E'\u2018'),
  '&rdquo;', E'\u201D')
WHERE comment LIKE '%&%'