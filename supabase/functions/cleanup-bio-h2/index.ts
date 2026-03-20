import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all speakers with h2 or --tw- in biography
    const { data: speakers, error } = await supabase
      .from("speakers")
      .select("id, name, biography")
      .or("biography.like.%<h2>%,biography.like.%--tw-%");

    if (error) throw error;

    const results: string[] = [];

    for (const speaker of speakers || []) {
      if (!speaker.biography) continue;

      let bio = speaker.biography;
      const originalBio = bio;

      // Remove <h2> tags with all their content (including massive inline styles)
      // Pattern: <h2 ...>Name</h2> — may have style attributes with Tailwind CSS vars
      bio = bio.replace(/<h2[^>]*>[\s\S]*?<\/h2>\s*/gi, '');

      if (bio !== originalBio) {
        const { error: updateError } = await supabase
          .from("speakers")
          .update({ biography: bio })
          .eq("id", speaker.id);

        if (updateError) {
          results.push(`❌ ${speaker.name}: ${updateError.message}`);
        } else {
          results.push(`✅ ${speaker.name}: cleaned`);
        }
      }
    }

    return new Response(JSON.stringify({ cleaned: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
