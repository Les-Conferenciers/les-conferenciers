import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Process speakers missing why_expertise OR why_impact
  const { data: speakers, error } = await supabase
    .from("speakers")
    .select("id, name, role, themes, biography, gender, why_expertise, why_impact")
    .eq("archived", false)
    .or("why_expertise.is.null,why_impact.is.null");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let updated = 0;
  let failed = 0;

  for (const speaker of speakers || []) {
    const fem = speaker.gender === "female";
    const themes = (speaker.themes || []).join(", ");
    const bioSnippet = (speaker.biography || "").replace(/<[^>]+>/g, "").slice(0, 600);

    const prompt = `Conférencier : ${speaker.name}
Rôle : ${speaker.role || "Conférencier"}
Genre : ${fem ? "F" : "M"}
Thèmes : ${themes}
Bio : ${bioSnippet}

Écris 2 textes ULTRA-COURTS (1 à 2 phrases max, zéro blabla) :

1. "expertise" : Ce qui rend ${speaker.name} légitime et unique. Un fait, un chiffre, une réalisation concrète tirée de la bio. Pas de "expert reconnu" ni de formule bateau.

2. "impact" : Ce que le public retient après son passage. Résultat concret, pas de promesse vague.

Style : 3e personne, direct, factuel. Commence par le prénom.

JSON uniquement : {"expertise": "...", "impact": "..."}`;

    try {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          console.log("Rate limited, waiting 10s...");
          await new Promise(r => setTimeout(r, 10000));
          failed++;
          continue;
        }
        console.error(`AI error for ${speaker.name}: ${aiResp.status}`);
        failed++;
        continue;
      }

      const aiData = await aiResp.json();
      const raw = aiData.choices?.[0]?.message?.content || "";
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.error(`No JSON in response for ${speaker.name}: ${raw.slice(0, 200)}`);
        failed++;
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.expertise || !parsed.impact) {
        console.error(`Missing fields for ${speaker.name}`);
        failed++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from("speakers")
        .update({
          why_expertise: parsed.expertise,
          why_impact: parsed.impact,
        })
        .eq("id", speaker.id);

      if (updateErr) {
        console.error(`Update error for ${speaker.name}:`, updateErr);
        failed++;
      } else {
        updated++;
        console.log(`✓ ${speaker.name}`);
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`Error for ${speaker.name}:`, e);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, updated, failed, total: speakers?.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
