import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { speaker_id, field } = await req.json();
    if (!speaker_id || !["biography", "why_expertise", "why_impact"].includes(field)) {
      throw new Error("Paramètres invalides");
    }

    // Fetch speaker data
    const { data: speaker, error: spErr } = await supabase
      .from("speakers")
      .select("*")
      .eq("id", speaker_id)
      .single();
    if (spErr || !speaker) throw new Error("Speaker non trouvé");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurée");

    const systemPrompt = `Tu es le rédacteur de l'agence de conférenciers "Les Conférenciers" (lesconferenciers.com). Tu rédiges des biographies professionnelles captivantes mais rigoureusement factuelles. Tu mélanges objectivité journalistique (style Wikipédia pour les faits) et narration immersive (storytelling sur la mission et la vision). Tu mets l'accent sur l'authenticité comme levier de performance et d'impact. Tu évites le jargon marketing creux et privilégies les résultats concrets.`;

    let userPrompt = "";
    if (field === "biography") {
      const genderHint = speaker.gender === "female" ? "Elle" : "Il";
      userPrompt = `Rédige une biographie professionnelle pour ${speaker.name} (${speaker.role || "conférencier"}) destinée au site lesconferenciers.com.

Contexte actuel : ${speaker.biography || "Aucune biographie existante."}
Thématiques : ${(speaker.themes || []).join(", ")}
Points clés : ${(speaker.key_points || []).join(", ")}

STRUCTURE OBLIGATOIRE :
1. L'Amorce (Accroche) : Une phrase forte qui résume la singularité. NE commence JAMAIS par le prénom ou le nom.
2. Le Parcours (Factuel) : Les étapes clés, les réalisations majeures et l'expertise technique. Dates, chiffres, institutions.
3. La Vision (Narratif) : Pourquoi ${genderHint.toLowerCase()} fait ce qu'${genderHint.toLowerCase()} fait et ce que le public ressent/apprend.
4. Signature : Une conclusion brève sur l'impact humain et son activité de conférenci${speaker.gender === "female" ? "ère" : "er"}.

CONTRAINTES DE RÉDACTION :
- Rédige à la troisième personne (${genderHint}).
- Utilise des verbes d'action puissants.
- Organise le texte en paragraphes aérés avec des sous-titres évocateurs en <strong>.
- Longueur : 500 à 700 mots.
- HTML sémantique : <p>, <strong>, <ul><li> pour les énumérations.
- Met en <strong> : dates, chiffres clés, titres/prix, institutions, mots-clés importants.
- 5 à 7 paragraphes séparés, chacun 2-3 phrases max.
- REFORMULATION 100% originale, anti-plagiat.
- AUCUN markdown (** ou *), uniquement du HTML.
- Intègre subtilement dans le dernier paragraphe une mention naturelle de son activité de conférenci${speaker.gender === "female" ? "ère" : "er"}.`;
    } else if (field === "why_expertise") {
      userPrompt = `Rédige un bloc "Expertise reconnue" pour ${speaker.name} (${speaker.role || "conférencier"}).
Bio actuelle : ${speaker.biography || "N/A"}
Expertise actuelle : ${speaker.why_expertise || "Aucune"}

Règles :
- 2-3 phrases maximum, très concises et percutantes
- Mets en avant les credentials, résultats concrets, reconnaissances
- Pas de HTML, texte brut uniquement
- Commence directement par les faits, pas par le nom`;
    } else {
      userPrompt = `Rédige un bloc "Impact mesurable" pour ${speaker.name} (${speaker.role || "conférencier"}).
Bio actuelle : ${speaker.biography || "N/A"}
Impact actuel : ${speaker.why_impact || "Aucun"}

Règles :
- 2-3 phrases maximum, très concises et percutantes  
- Mets en avant l'impact concret de ses interventions sur les audiences
- Pas de HTML, texte brut uniquement
- Commence directement par l'impact, pas par le nom`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erreur AI gateway");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ success: true, content, field }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
