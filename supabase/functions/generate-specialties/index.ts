import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un expert en personal branding de conférenciers professionnels.
On te donne le nom, le rôle et la biographie d'un conférencier. Tu dois produire UNE SEULE ligne de spécialité courte et percutante (max 6-8 mots) qui résume son signe distinctif majeur.

Exemples de spécialités attendues :
- "Chef Étoilé et Homme d'Affaires"
- "Explorateur et Aventurier Extrême"  
- "Championne Olympique de Judo"
- "Neuropsychiatre et Essayiste"
- "Fondateur de BlaBlaCar"
- "Ancien Négociateur du RAID"
- "Astrophysicien et Vulgarisateur"
- "Serial Entrepreneur Tech"
- "Philosophe et Écrivain"
- "Champion du Monde de Pâtisserie"

Règles :
1. JAMAIS de phrase complète, juste un titre court
2. Commence par la distinction la plus forte / le fait le plus connu
3. Utilise des majuscules sur les mots clés (style titre)
4. Pas de "Conférencier" dans la spécialité (c'est redondant)
5. Si la personne est connue pour avoir fondé une entreprise célèbre, mentionne-la
6. Réponds UNIQUEMENT avec la spécialité, rien d'autre`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { speakerId } = await req.json().catch(() => ({}));

    let query = supabase
      .from("speakers")
      .select("id, name, role, biography, specialty");

    if (speakerId) {
      query = query.eq("id", speakerId);
    } else {
      query = query.is("specialty", null);
    }

    const { data: speakers, error } = await query.limit(500);
    if (error) throw error;

    const results: { name: string; specialty: string; status: string }[] = [];

    // Process in batches of 5
    for (let i = 0; i < (speakers || []).length; i += 5) {
      const batch = speakers!.slice(i, i + 5);
      
      const promises = batch.map(async (speaker) => {
        if (speaker.specialty && !speakerId) {
          return { name: speaker.name, specialty: speaker.specialty, status: "skipped" };
        }

        const bio = speaker.biography || "";
        const role = speaker.role || "";
        
        if (!bio && !role) {
          return { name: speaker.name, specialty: "", status: "skipped_no_data" };
        }

        try {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Nom : ${speaker.name}\nRôle : ${role}\nBiographie : ${bio.substring(0, 500)}` },
              ],
              temperature: 0.2,
              max_tokens: 50,
            }),
          });

          const data = await response.json();
          let specialty = data.choices?.[0]?.message?.content?.trim();

          if (!specialty) {
            return { name: speaker.name, specialty: "", status: "ai_no_response" };
          }

          // Clean quotes if present
          specialty = specialty.replace(/^["'«]|["'»]$/g, "").trim();

          const { error: updateError } = await supabase
            .from("speakers")
            .update({ specialty })
            .eq("id", speaker.id);

          if (updateError) {
            return { name: speaker.name, specialty, status: `error: ${updateError.message}` };
          }
          return { name: speaker.name, specialty, status: "generated" };
        } catch (e) {
          return { name: speaker.name, specialty: "", status: `error: ${e.message}` };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const generated = results.filter(r => r.status === "generated").length;

    return new Response(
      JSON.stringify({
        summary: { total: results.length, generated, skipped: results.length - generated },
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
