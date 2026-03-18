
CREATE OR REPLACE FUNCTION public.normalize_themes(input_themes text[])
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  result text[] := '{}';
  theme text;
  normalized text;
  seen text[] := '{}';
BEGIN
  FOREACH theme IN ARRAY input_themes LOOP
    theme := trim(theme);
    IF theme = '' THEN CONTINUE; END IF;
    IF theme LIKE '%I %' AND length(theme) > 30 THEN CONTINUE; END IF;
    
    normalized := CASE
      WHEN lower(theme) IN ('cohésion', 'cohésion d''equipe', 'cohésion d''équipe', 'cohésion de groupe', 'cohésion de groupe', 'esprit d''equipe', 'esprit d''équipe', 'collectif', 'performance collective') THEN 'Cohésion d''équipe'
      WHEN lower(theme) IN ('ecologie', 'écologie', 'environnement', 'transition écologique', 'sobriété énergétique', 'changement climatique') THEN 'Écologie & Environnement'
      WHEN lower(theme) IN ('gestion de l''échec', 'gestion de l''echec', 'echec', 'rebondir après un échec', 'succès et échecs', 'droit à l''erreur', 'rebond') THEN 'Gestion de l''échec'
      WHEN lower(theme) IN ('conduite du changement', 'adaptation au changement', 'adaptabilité', 'adaptabilité/conduite du changement', 'transformation') THEN 'Conduite du changement'
      WHEN lower(theme) = 'innovation' THEN 'Innovation'
      WHEN lower(theme) = 'management' THEN 'Management'
      WHEN lower(theme) IN ('intelligence artificielle') THEN 'Intelligence artificielle'
      WHEN lower(theme) IN ('intelligence collective') THEN 'Intelligence collective'
      WHEN lower(theme) IN ('intelligence émotionnelle', 'intelligence emotionnelle') THEN 'Intelligence émotionnelle'
      WHEN lower(theme) IN ('intelligence relationnelle') THEN 'Intelligence relationnelle'
      WHEN lower(theme) IN ('bien être', 'bien-être', 'bien-être au travail', 'qualité de vie au travail', 'bonheur') THEN 'Bien-être au travail'
      WHEN lower(theme) IN ('gestion de crise', 'gestion de crise / stress', 'gestion de crises', 'gestion des risques', 'maîtrise des risques') THEN 'Gestion de crise'
      WHEN lower(theme) IN ('gestion du stress', 'gestion de stress', 'résilience & gestion du stress') THEN 'Gestion du stress'
      WHEN lower(theme) IN ('gestion des émotions', 'gestion des emotions') THEN 'Gestion des émotions'
      WHEN lower(theme) IN ('gestion des conflit', 'gestion des conflits') THEN 'Gestion des conflits'
      WHEN lower(theme) IN ('entrepreneuriat', 'entreprenariat', 'entreprenauriat', 'entrepreunariat') THEN 'Entrepreneuriat'
      WHEN lower(theme) IN ('prise de parole', 'prise de parole en public', 'éloquence', 'eloquence', 'storytelling') THEN 'Prise de parole'
      WHEN lower(theme) IN ('transformation digitale', 'digitalisation', 'stratégie digitale') THEN 'Transformation digitale'
      WHEN lower(theme) IN ('dépassement de soi', 'dépassement de soi i performance') THEN 'Dépassement de soi'
      WHEN lower(theme) IN ('expérience client', 'expérience clients', 'expérience-client', 'culture client') THEN 'Expérience client'
      WHEN lower(theme) IN ('diversité', 'la diversité', 'diversité et handicap') THEN 'Diversité & Inclusion'
      WHEN lower(theme) IN ('egalité homme femme', 'parité homme-femme', 'lutte contre le sexisme') THEN 'Égalité & Parité'
      WHEN lower(theme) IN ('jeunes générations') THEN 'Jeunes générations'
      WHEN lower(theme) IN ('strategie', 'stratégie') THEN 'Stratégie'
      WHEN lower(theme) IN ('economie', 'économie') THEN 'Économie'
      WHEN lower(theme) IN ('négociation', 'négociation/vente') THEN 'Négociation'
      WHEN lower(theme) IN ('confiance', 'confiance en soi', 'empowerment') THEN 'Confiance en soi'
      WHEN lower(theme) IN ('leadership', 'leadership i conduite du changement') THEN 'Leadership'
      WHEN lower(theme) = 'innovation i gestion de crise' THEN 'Innovation'
      ELSE theme
    END;
    
    IF NOT normalized = ANY(seen) THEN
      seen := array_append(seen, normalized);
      result := array_append(result, normalized);
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

UPDATE public.speakers
SET themes = normalize_themes(themes)
WHERE themes IS NOT NULL AND array_length(themes, 1) > 0;

DROP FUNCTION public.normalize_themes(text[]);
