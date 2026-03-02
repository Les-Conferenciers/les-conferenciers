ALTER TABLE public.speakers ADD COLUMN gender text DEFAULT 'male';

-- Update female speakers based on first names
UPDATE public.speakers SET gender = 'female' WHERE 
  name LIKE 'Anne-%' OR
  name LIKE 'Annika%' OR
  name LIKE 'Aurélie%' OR
  name LIKE 'Catherine%' OR
  name LIKE 'Cécile%' OR
  name LIKE 'Céline%' OR
  name LIKE 'Claudie%' OR
  name LIKE 'Coumba%' OR
  name LIKE 'Déborah%' OR
  name LIKE 'Delphine%' OR
  name LIKE 'Dorine%' OR
  name LIKE 'Élisabeth%' OR
  name LIKE 'Élodie%' OR
  name LIKE 'Emmanuelle%' OR
  name LIKE 'Florence%' OR
  name LIKE 'Floria%' OR
  name LIKE 'Gaëlle%' OR
  name LIKE 'Hapsatou%' OR
  name LIKE 'Isabelle%' OR
  name LIKE 'Isalou%' OR
  name LIKE 'Julia%' OR
  name LIKE 'Juliette%' OR
  name LIKE 'Justine%' OR
  name LIKE 'Karine%' OR
  name LIKE 'Kenza%' OR
  name LIKE 'Laura%' OR
  name LIKE 'Lucie%' OR
  name LIKE 'Malene%' OR
  name LIKE 'Marie%' OR
  name LIKE 'Marie-%' OR
  name LIKE 'Marlène%' OR
  name LIKE 'Maryse%' OR
  name LIKE 'Mélanie%' OR
  name LIKE 'Michaela%' OR
  name LIKE 'Nina%' OR
  name LIKE 'Peggy%' OR
  name LIKE 'Raphaëlle%' OR
  name LIKE 'Rose' OR
  name LIKE 'Samah%' OR
  name LIKE 'Sandra%' OR
  name LIKE 'Solveig%' OR
  name LIKE 'Sonia%' OR
  name LIKE 'Stéphanie%' OR
  name LIKE 'Tatiana%' OR
  name LIKE 'Thaïs%' OR
  name LIKE 'Valérie%' OR
  name LIKE 'Vanessa%' OR
  name LIKE 'Virginie%';