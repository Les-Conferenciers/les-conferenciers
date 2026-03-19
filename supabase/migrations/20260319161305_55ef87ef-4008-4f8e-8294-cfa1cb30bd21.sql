-- Add bio image for Romain Barnier
UPDATE public.speakers 
SET biography = biography || '<p><img src="https://www.lesconferenciers.com/wp-content/uploads/2025/05/romain-barnier-bio.png" alt="Romain Barnier" style="float:right;margin:0 0 15px 20px;max-width:250px;border-radius:12px;" /></p>'
WHERE slug = 'romain-barnier' AND biography IS NOT NULL AND biography NOT LIKE '%romain-barnier-bio%';

-- Add bio image for Malek Boukerchi
UPDATE public.speakers 
SET biography = biography || '<p><img src="https://www.lesconferenciers.com/wp-content/uploads/2022/05/malek-boukerchi.png" alt="Malek Boukerchi" style="float:right;margin:0 0 15px 20px;max-width:250px;border-radius:12px;" /></p>'
WHERE slug = 'malek-boukerchi' AND biography IS NOT NULL AND biography NOT LIKE '%malek-boukerchi.png%';