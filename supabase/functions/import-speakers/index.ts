import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Liste canonique des thématiques (doit rester synchronisée avec src/lib/parseThemes.ts)
const CANONICAL_THEMES = new Set<string>([
  "Adaptabilité","Audace","Bien-être au travail","Bienveillance","Cohésion d'équipe","Collectif","Communication","Conduite du changement","Confiance","Confiance en soi","Créativité","Cybersécurité","Dépassement de soi","Diversité et handicap","Droit à l'erreur","Économie","Empowerment","Engagement","Entrepreneuriat","Environnement","Esprit d'équipe","Expérience client","Expérience collaborateur","Facteur humain","Géopolitique","Gestion de crise","Gestion de l'échec","Gestion des conflits","Gestion des émotions","Gestion des risques","Gestion du stress","Handicap","Innovation","Intelligence artificielle","Intelligence collective","Intelligence émotionnelle","Intelligence relationnelle","Jeunes générations","Leadership","Maîtrise des risques","Management","Marketing","Motivation","Négociation","Neurosciences","Optimisme","Parité","Performance","Performance collective","Prise de décision","Prise de parole","Résilience","Storytelling","Stratégie","Transformation","Transformation digitale",
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const externalKey = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');
    const localUrl = Deno.env.get('SUPABASE_URL');
    const localServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey) {
      throw new Error('External Supabase credentials not configured');
    }
    if (!localUrl || !localServiceKey) {
      throw new Error('Local Supabase credentials not configured');
    }

    const externalClient = createClient(externalUrl, externalKey);
    const localClient = createClient(localUrl, localServiceKey);

    // Fetch all speakers from external DB (paginate to get all)
    let allSpeakers: any[] = [];
    let offset = 0;
    const pageSize = 500;
    
    while (true) {
      const { data, error } = await externalClient
        .from('speakers')
        .select('*')
        .range(offset, offset + pageSize - 1);

      if (error) throw new Error(`External fetch error: ${error.message}`);
      if (!data || data.length === 0) break;
      
      allSpeakers = [...allSpeakers, data];
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Flatten
    allSpeakers = allSpeakers.flat();

    console.log(`Fetched ${allSpeakers.length} speakers from external DB`);

    // Delete existing speakers in local DB
    await localClient.from('speakers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < allSpeakers.length; i += batchSize) {
      const batch = allSpeakers.slice(i, i + batchSize).map(s => {
        // Handle key_points - could be string, array, or null
        let keyPoints: string[] = [];
        if (Array.isArray(s.key_points)) {
          keyPoints = s.key_points;
        } else if (typeof s.key_points === 'string' && s.key_points) {
          keyPoints = s.key_points.split('\n').filter((p: string) => p.trim());
        }

        // Handle themes similarly
        let themes: string[] = [];
        if (Array.isArray(s.themes)) {
          themes = s.themes;
        } else if (typeof s.themes === 'string' && s.themes) {
          themes = s.themes.split(',').map((t: string) => t.trim()).filter(Boolean);
        }

        // Filter themes to canonical list only
        themes = themes.filter((t: string) => CANONICAL_THEMES.has(t));

        return {
          name: s.name,
          slug: s.slug,
          role: s.role || null,
          themes,
          biography: s.biography || null,
          key_points: keyPoints,
          image_url: s.image_url || null,
          seo_title: s.seo_title || null,
          meta_description: s.meta_description || null,
          featured: s.featured || false,
        };
      });

      const { error: insertError } = await localClient.from('speakers').insert(batch);
      if (insertError) throw new Error(`Insert error at batch ${i}: ${insertError.message}`);
      inserted += batch.length;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      fetched: allSpeakers.length,
      inserted 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
