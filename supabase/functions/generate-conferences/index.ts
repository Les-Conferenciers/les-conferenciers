import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function callAI(apiKey: string, prompt: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`AI error: ${resp.status}`);
  const data = await resp.json();
  let content = data.choices?.[0]?.message?.content || "";
  content = content.replace(/^```json\n?/i, "").replace(/\n?```$/i, "").trim();
  content = content.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || "generate"; // "generate" | "reformulate" | "generate_single"
  const speakerIds: string[] = body.speaker_ids || [];

  if (!speakerIds.length) {
    return new Response(JSON.stringify({ error: "No speaker_ids provided" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const speakerId of speakerIds) {
    try {
      // Get speaker info
      const { data: speaker } = await supabase
        .from("speakers")
        .select("id, name, role, specialty, themes, biography, key_points")
        .eq("id", speakerId)
        .single();

      if (!speaker) {
        results.push({ id: speakerId, error: "Speaker not found" });
        continue;
      }

      if (mode === "generate") {
        // Check if already has conferences
        const { count } = await supabase
          .from("speaker_conferences")
          .select("id", { count: "exact", head: true })
          .eq("speaker_id", speakerId);

        if (count && count > 0) {
          results.push({ id: speakerId, name: speaker.name, skipped: true, reason: "Already has conferences" });
          continue;
        }

        // Strip HTML from biography for the prompt
        const bioText = (speaker.biography || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const themes = (speaker.themes || []).join(", ");
        const keyPoints = (speaker.key_points || []).join(", ");

        const prompt = `Tu es un r\u00e9dacteur expert pour l'agence de conf\u00e9renciers premium lesconferenciers.com.

\u00c0 partir de la biographie et des informations du conf\u00e9rencier, g\u00e9n\u00e8re 2 \u00e0 3 conf\u00e9rences pertinentes qu'il pourrait proposer.

Conf\u00e9rencier : ${speaker.name}
R\u00f4le : ${speaker.specialty || speaker.role || ""}
Th\u00e9matiques : ${themes}
Points cl\u00e9s : ${keyPoints}
Biographie : ${bioText.substring(0, 2000)}

R\u00e8gles :
- Chaque conf\u00e9rence a un titre accrocheur et professionnel (pas g\u00e9n\u00e9rique)
- La description fait 2-4 paragraphes en HTML (<p>, <strong>)
- Mets en gras les termes cl\u00e9s, chiffres, concepts importants (5-8 mots/expressions en gras par description)
- Ton premium, engageant, orient\u00e9 b\u00e9n\u00e9fices pour l'audience corporate
- Ne mentionne AUCUN concurrent (Orators, WeChamp, Simone & Nelson)
- Base-toi sur l'expertise r\u00e9elle du conf\u00e9rencier, pas d'invention

R\u00e9ponds UNIQUEMENT en JSON valide (array), format :
[{"title": "...", "description": "<p>...</p>"}]`;

        const aiResult = await callAI(LOVABLE_API_KEY, prompt);
        let conferences;
        try {
          conferences = JSON.parse(aiResult);
        } catch {
          results.push({ id: speakerId, name: speaker.name, error: "Failed to parse AI response", raw: aiResult.substring(0, 200) });
          continue;
        }

        let inserted = 0;
        for (let i = 0; i < conferences.length; i++) {
          const conf = conferences[i];
          const { error: insertErr } = await supabase
            .from("speaker_conferences")
            .insert({
              speaker_id: speakerId,
              title: conf.title,
              description: conf.description,
              display_order: i,
            });
          if (!insertErr) inserted++;
        }

        results.push({ id: speakerId, name: speaker.name, generated: inserted });

      } else if (mode === "reformulate") {
        // Get existing conferences
        const { data: conferences } = await supabase
          .from("speaker_conferences")
          .select("*")
          .eq("speaker_id", speakerId)
          .order("display_order");

        if (!conferences || conferences.length === 0) {
          results.push({ id: speakerId, name: speaker.name, skipped: true, reason: "No conferences to reformulate" });
          continue;
        }

        let reformulated = 0;
        for (const conf of conferences) {
          const prompt = `Tu es un r\u00e9dacteur expert pour l'agence de conf\u00e9renciers premium lesconferenciers.com.

Reformule le titre et la description de cette conf\u00e9rence pour les rendre percutants et professionnels.

Conf\u00e9rencier : ${speaker.name} (${speaker.specialty || speaker.role || ""})
Titre actuel : ${conf.title}
Description actuelle : ${(conf.description || "Aucune description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}

R\u00e8gles :
- Si le titre est g\u00e9n\u00e9rique (ex: "Conf\u00e9rence"), cr\u00e9e un vrai titre accrocheur
- Description en 2-4 paragraphes HTML (<p>, <strong>)
- Mets en gras 5-8 termes cl\u00e9s/chiffres/concepts importants
- Ton premium, engageant, orient\u00e9 b\u00e9n\u00e9fices pour l'audience corporate
- Corrige la ponctuation (espaces apr\u00e8s les points, etc.)
- V\u00e9rifie que le texte se termine par un point
- Ne mentionne AUCUN concurrent (Orators, WeChamp, Simone & Nelson)
- Si des \u00e9num\u00e9rations existent, utilise des <br> pour les s\u00e9parer

R\u00e9ponds UNIQUEMENT en JSON : {"title": "...", "description": "<p>...</p>"}`;

          try {
            const aiResult = await callAI(LOVABLE_API_KEY, prompt);
            const parsed = JSON.parse(aiResult);
            
            const updateData: any = {};
            if (parsed.title) updateData.title = parsed.title;
            if (parsed.description) updateData.description = parsed.description;

            if (Object.keys(updateData).length > 0) {
              const { error: updateErr } = await supabase
                .from("speaker_conferences")
                .update(updateData)
                .eq("id", conf.id);
              if (!updateErr) reformulated++;
            }
          } catch (err) {
            // Continue to next conference
          }
        }

        results.push({ id: speakerId, name: speaker.name, reformulated });
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      results.push({ id: speakerId, error: err.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
