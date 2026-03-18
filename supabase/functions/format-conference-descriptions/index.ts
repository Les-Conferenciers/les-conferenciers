import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function formatPlainTextToHtml(text: string): string {
  if (!text || text.trim().length === 0) return text;
  
  // Already has HTML tags
  if (/<p>|<br\s*\/?>|<ul>|<ol>|<div>/.test(text)) return text;

  let result = text.trim();

  // Normalize line breaks
  result = result.replace(/\r\n/g, "\n");

  // Split on double newlines first (real paragraphs)
  let paragraphs = result.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // If only one big block, try to split on single newlines
  if (paragraphs.length === 1) {
    const lines = result.split(/\n/).filter(l => l.trim().length > 0);
    if (lines.length > 1) {
      paragraphs = lines;
    }
  }

  // If still one block, try to split at sentence boundaries for very long texts
  if (paragraphs.length === 1 && result.length > 500) {
    // Find good split points: after sentences ending with . followed by uppercase
    const splits: string[] = [];
    let current = "";
    const sentences = result.split(/(?<=\.)\s+(?=[A-ZÀ-ÖØ-Ý])/);
    
    for (const sentence of sentences) {
      current += (current ? " " : "") + sentence;
      if (current.length > 200) {
        splits.push(current);
        current = "";
      }
    }
    if (current) splits.push(current);
    if (splits.length > 1) paragraphs = splits;
  }

  // Detect and bold key terms
  const boldPatterns = [
    /(\d+[\s]?(?:ans|pays|millions?|milliards?|livres?|ouvrages?|exemplaires?|collaborateurs?))/gi,
    /(champion(?:ne)?|record|prix|médaille|best-seller|pionnière?|fondateur|fondatrice)/gi,
  ];

  const processed = paragraphs.map(p => {
    let para = p.trim();
    
    // Detect list items (– or - at start)
    if (/^[–—-]\s/.test(para)) {
      return `<p>${para}</p>`;
    }
    
    // Bold key terms
    for (const pattern of boldPatterns) {
      para = para.replace(pattern, '<strong>$1</strong>');
    }
    
    return `<p>${para}</p>`;
  });

  return processed.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json().catch(() => ({}));

  // Single conference AI reformulation mode
  if (body.conference_id && body.speaker_name) {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Title-only regeneration mode
    if (body.mode === "title_only") {
      const titlePrompt = `Tu es un rédacteur expert pour une agence de conférenciers premium (lesconferenciers.com).
À partir du contenu de cette conférence, génère un nouveau titre accrocheur et professionnel.

Conférencier : ${body.speaker_name} (${body.speaker_role || ""})
Titre actuel : ${body.title}
Description : ${(body.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}

Règles :
- Le titre doit être percutant, mémorable, orienté bénéfice pour l'audience corporate
- Pas de titre générique comme "Conférence de..." ou "Intervention sur..."
- Maximum 10 mots
- Ne mentionne AUCUN concurrent
- Réponds UNIQUEMENT avec le nouveau titre, rien d'autre (pas de guillemets)`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: titlePrompt }],
          }),
        });
        if (!aiResp.ok) throw new Error(`AI error: ${aiResp.status}`);
        const aiData = await aiResp.json();
        let title = (aiData.choices?.[0]?.message?.content || "").trim().replace(/^["«]|["»]$/g, "");
        return new Response(JSON.stringify({ success: true, title }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const prompt = `Tu es un rédacteur expert pour une agence de conférenciers premium (lesconferenciers.com).
Reformule la description de cette conférence pour la rendre percutante, engageante et professionnelle.

Conférencier : ${body.speaker_name} (${body.speaker_role || ""})
Titre de la conférence : ${body.title}
Description actuelle : ${body.description || "Aucune description"}

Règles :
- Utilise des balises HTML (<p>, <strong>) pour structurer
- 2-4 paragraphes maximum
- Mets en gras les termes clés et chiffres marquants
- Ton professionnel mais engageant, orienté bénéfices pour l'audience
- Ne mentionne AUCUN concurrent (Orators, WeChamp, Simone & Nelson)
- Retourne UNIQUEMENT le HTML de la description, rien d'autre`;

    try {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        return new Response(JSON.stringify({ error: `AI error: ${aiResp.status} ${errText}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResp.json();
      let description = aiData.choices?.[0]?.message?.content || "";
      // Clean markdown code blocks if present
      description = description.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

      return new Response(JSON.stringify({ success: true, description }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Batch formatting mode (existing)
  const { data: conferences, error } = await supabase
    .from("speaker_conferences")
    .select("id, title, description")
    .not("description", "is", null)
    .gt("description", "");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let formatted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const conf of conferences || []) {
    const desc = conf.description || "";
    if (/<p>|<br\s*\/?>/.test(desc)) { skipped++; continue; }
    if (desc.length < 50) { skipped++; continue; }

    const newDesc = formatPlainTextToHtml(desc);
    if (newDesc !== desc) {
      const { error: updateErr } = await supabase
        .from("speaker_conferences")
        .update({ description: newDesc })
        .eq("id", conf.id);
      if (updateErr) { errors.push(`${conf.id}: ${updateErr.message}`); }
      else { formatted++; }
    } else { skipped++; }
  }

  return new Response(
    JSON.stringify({ success: true, formatted, skipped, errors, total: conferences?.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
