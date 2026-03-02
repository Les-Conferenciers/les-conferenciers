import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un rédacteur web expert. Tu reçois la biographie brute d'un conférencier et tu dois la reformater en HTML riche pour un site web professionnel.

Règles de formatage :
1. Sépare le texte en paragraphes courts et aérés avec des balises <p>
2. Mets en <strong> les expressions clés importantes : titres de postes, réalisations marquantes, noms d'organisations, distinctions, concepts clés de leurs conférences
3. Mets en <strong> les chiffres significatifs (années, nombres d'exemplaires, de pays, etc.)
4. Si le texte commence par le nom du conférencier, RETIRE-LE (il est déjà affiché dans le titre H1 de la page)
5. La première phrase doit commencer directement par une description ou un fait marquant
6. Utilise des <ul><li> quand il y a des énumérations naturelles dans le texte
7. Ne modifie PAS le contenu factuel, garde les mêmes informations
8. Ajoute des sauts de paragraphes pour rythmer la lecture (max 3-4 phrases par paragraphe)
9. N'ajoute PAS de titres H2/H3, juste du texte enrichi
10. Le résultat doit être UNIQUEMENT du HTML (pas de markdown), sans balise <html>, <body> etc.
11. Commence directement avec <p>, pas d'enveloppe supplémentaire

Exemple de style attendu :
<p>Né en 1990 à Paris, c'est un <strong>entrepreneur français reconnu</strong> pour sa vision avant-gardiste de l'intelligence artificielle et son engagement en faveur d'une technologie au service du bien commun. Diplômé de <strong>l'École normale supérieure ENS</strong>, d'<strong>HEC Paris</strong> et de la Sorbonne en histoire de l'art, il développe très tôt une <strong>approche pluridisciplinaire mêlant culture, créativité et innovation</strong>.</p>

<p>En <strong>2013</strong>, il parcourt le monde dans le cadre d'un programme d'entrepreneuriat social avec HEC, découvrant les grands enjeux liés à l'éducation, à l'énergie ou encore au développement durable.</p>`;

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

    // Get speakers to process
    let query = supabase
      .from("speakers")
      .select("id, name, biography")
      .not("biography", "is", null);

    if (speakerId) {
      query = query.eq("id", speakerId);
    } else {
      // Only process plain text bios (not already HTML formatted)
      // We process all and let the AI handle it
    }

    const { data: speakers, error } = await query;
    if (error) throw error;

    const results: { name: string; status: string }[] = [];

    for (const speaker of speakers || []) {
      // Skip if already rich HTML (has multiple <p> or <strong> tags)
      const hasRichHtml = (speaker.biography?.match(/<strong>/g) || []).length >= 3 && speaker.biography?.includes("<p>");
      if (hasRichHtml && !speakerId) {
        results.push({ name: speaker.name, status: "skipped_already_formatted" });
        continue;
      }

      // Skip very short bios
      if (!speaker.biography || speaker.biography.length < 50) {
        results.push({ name: speaker.name, status: "skipped_too_short" });
        continue;
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
              { role: "user", content: `Nom du conférencier : ${speaker.name}\n\nBiographie brute :\n${speaker.biography}` },
            ],
            temperature: 0.3,
          }),
        });

        const data = await response.json();
        let formattedBio = data.choices?.[0]?.message?.content;

        if (!formattedBio) {
          results.push({ name: speaker.name, status: "ai_no_response" });
          continue;
        }

        // Clean up: remove markdown code fences if AI wrapped it
        formattedBio = formattedBio.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

        // Update the speaker
        const { error: updateError } = await supabase
          .from("speakers")
          .update({ biography: formattedBio })
          .eq("id", speaker.id);

        if (updateError) {
          results.push({ name: speaker.name, status: `update_error: ${updateError.message}` });
        } else {
          results.push({ name: speaker.name, status: "formatted" });
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        results.push({ name: speaker.name, status: `error: ${e.message}` });
      }
    }

    const formatted = results.filter(r => r.status === "formatted").length;

    return new Response(
      JSON.stringify({
        summary: { total: results.length, formatted, skipped: results.length - formatted },
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
