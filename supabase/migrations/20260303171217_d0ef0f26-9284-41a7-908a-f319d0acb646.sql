-- Fix Nicolas Vanier: "MotivationRien de tel..." -> title "Motivation", description = rest
UPDATE speaker_conferences SET title = 'Motivation', description = '<p>' || substring(title from 11) || '</p>' WHERE id = 'b402e25c-4e31-4f21-9d1b-052efa107a31';

-- Fix Karine Baillet: has actual title in quotes
UPDATE speaker_conferences SET title = 'L''énergie individuelle et la performance', description = '<p>' || substring(title from 52) || '</p>' WHERE id = 'a268b937-6b68-46cc-a18c-99e1a4fac573';

-- Fix Peggy Bouchet: description text as title
UPDATE speaker_conferences SET title = 'Muscler son audace, son courage, son engagement', description = '<p>' || title || '</p>' WHERE id = '812033bc-ca52-4b8e-bfc1-8d15928dae4e';

-- Fix Jacques Lecomte: description text as title
UPDATE speaker_conferences SET title = 'Conférence', description = '<p>' || title || '</p>' WHERE id = '01898a25-5adf-4ca2-84f8-d78c12e0e44b';

-- Fix Vincent Boichard: description text as title
UPDATE speaker_conferences SET title = 'Conférence', description = '<p>' || title || '</p>' WHERE id = '967257f8-9cf1-493b-87c5-517dce0683fc';

-- Fix Rose: description as title
UPDATE speaker_conferences SET title = 'Conférence', description = '<p>' || title || '</p>' WHERE id IN (SELECT sc.id FROM speaker_conferences sc JOIN speakers s ON sc.speaker_id = s.id WHERE s.name = 'Rose' AND sc.title LIKE 'c''est «%');