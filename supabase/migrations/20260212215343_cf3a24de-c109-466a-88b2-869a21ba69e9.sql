CREATE TABLE public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT,
  themes TEXT[] DEFAULT '{}',
  biography TEXT,
  key_points TEXT[] DEFAULT '{}',
  image_url TEXT,
  seo_title TEXT,
  meta_description TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.speakers
  FOR SELECT USING (true);

-- Insert sample data
INSERT INTO public.speakers (name, slug, role, themes, biography, key_points, image_url, seo_title, meta_description, featured)
VALUES 
(
  'Sophie Moreau', 
  'sophie-moreau', 
  'Innovatrice Tech & Futuriste', 
  ARRAY['Innovation', 'Technologie', 'Futur du Travail'], 
  'Sophie Moreau est une visionnaire reconnue dans le domaine de la technologie et de l''innovation. Ancienne CTO de plusieurs startups licornes, elle partage aujourd''hui sa vision d''un futur où la technologie sert l''humain. Ses conférences inspirantes poussent les dirigeants à repenser leurs stratégies digitales.',
  ARRAY['L''impact de l''IA sur le management', 'Construire une culture de l''innovation', 'Tech for Good : mythe ou réalité ?'],
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
  'Sophie Moreau - Conférencière Innovation & Tech',
  'Découvrez Sophie Moreau, experte en innovation technologique. Réservez une conférence sur le futur du travail et l''IA.',
  true
),
(
  'Jean-Luc Dubois', 
  'jean-luc-dubois', 
  'Explorateur & Leader', 
  ARRAY['Leadership', 'Motivation', 'Dépassement de soi'], 
  'Après avoir gravi les plus hauts sommets du monde, Jean-Luc Dubois transpose les leçons de la haute montagne au monde de l''entreprise. Il parle de gestion des risques, de confiance en équipe et de la résilience nécessaire pour atteindre des objectifs ambitieux.',
  ARRAY['La confiance en milieu hostile', 'Gestion des risques et prise de décision', 'Atteindre ses sommets personnels'],
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800',
  'Jean-Luc Dubois - Conférencier Leadership & Motivation',
  'Jean-Luc Dubois, explorateur et conférencier, partage ses leçons de leadership et de résilience pour les entreprises.',
  true
),
(
  'Dr. Amélie Lacroix', 
  'amelie-lacroix', 
  'Neuroscientifique', 
  ARRAY['Bien-être', 'Sciences', 'Performance'], 
  'Docteur en neurosciences cognitives, Amélie Lacroix décrypte les mécanismes du cerveau pour améliorer la performance et le bien-être au travail. Ses interventions ludiques et scientifiques permettent de mieux comprendre comment nous fonctionnons pour mieux travailler ensemble.',
  ARRAY['Le cerveau au travail', 'Neurosciences et prise de décision', 'Stress et performance : l''équilibre'],
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
  'Dr. Amélie Lacroix - Neurosciences et Performance',
  'Comprenez le cerveau avec Dr. Amélie Lacroix. Conférences sur les neurosciences appliquées au monde du travail.',
  true
),
(
  'Marc André', 
  'marc-andre', 
  'Entrepreneur Écologique', 
  ARRAY['Développement Durable', 'Entrepreneuriat', 'RSE'], 
  'Fondateur de GreenStart, Marc André prouve qu''il est possible de concilier profitabilité et impact écologique positif. Il partage son parcours d''entrepreneur engagé et donne des clés concrètes pour intégrer la RSE au cœur de la stratégie d''entreprise.',
  ARRAY['L''économie circulaire en pratique', 'Entreprendre pour la planète', 'RSE : levier de croissance'],
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
  'Marc André - Conférencier RSE & Entrepreneuriat',
  'Marc André vous guide vers un entrepreneuriat durable. Conférences sur la RSE et l''économie circulaire.',
  true
);