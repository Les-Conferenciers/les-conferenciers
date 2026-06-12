import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeApostrophes(s: string): string {
  return s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

async function callAI(apiKey: string, system: string, user: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  let content: string = data.choices?.[0]?.message?.content || "";
  content = content.replace(/^```json\n?/i, "").replace(/\n?```$/i, "").trim();
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { profile_id } = await req.json();
    if (!profile_id) {
      return new Response(JSON.stringify({ error: "profile_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: pErr } = await supabase
      .from("speaker_profiles")
      .select("id, name, landing_label, subtitle, linked_profile_ids, extra_speaker_ids")
      .eq("id", profile_id)
      .single();
    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileIds = [profile.id, ...((profile.linked_profile_ids as string[]) || [])];
    const extraIds = (profile.extra_speaker_ids as string[]) || [];

    const [r1, r2] = await Promise.all([
      supabase.from("speakers").select("id, name, role, specialty, biography").eq("archived", false).in("profile_id", profileIds).limit(60),
      extraIds.length
        ? supabase.from("speakers").select("id, name, role, specialty, biography").eq("archived", false).in("id", extraIds)
        : Promise.resolve({ data: [] as any[], error: null } as any),
    ]);
    const map = new Map<string, any>();
    [...((r1.data as any[]) || []), ...(((r2 as any).data as any[]) || [])].forEach((s) => map.set(s.id, s));
    const speakers = Array.from(map.values());

    const speakerSummaries = speakers.slice(0, 25).map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role || "",
      bio_excerpt: stripHtml(s.biography).slice(0, 280),
    }));

    const system = `Tu es la plume éditoriale de l'agence francophone "Les Conférenciers" (https://www.lesconferenciers.com), agence premium de conférenciers.
Ton : professionnel, premium, factuel, chaleureux, jamais commercial agressif, jamais "wow". Français impeccable. Toujours apostrophes droites (').
Interdictions absolues :
- Pas de plagiat, ne reprends jamais la formulation d'un site concurrent (wechamp, etc.)
- Ne cite jamais d'agence concurrente
- Pas de mise en gras automatique, pas de markdown **, pas de HTML
- Pas d'invention de faits sur des personnes nommées (reste générique sur leur apport)
- Pas de superlatifs vides ("incroyable", "exceptionnel à couper le souffle")
Tu réponds STRICTEMENT en JSON valide, sans texte autour.`;

    const user = `Profil de landing : "${profile.landing_label || profile.name}"
${profile.subtitle ? `Sous-titre : ${profile.subtitle}` : ""}

Conférenciers représentatifs disponibles dans ce profil (pour exemples concrets) :
${speakerSummaries.map((s) => `- ${s.name}${s.role ? ` (${s.role})` : ""}`).join("\n")}

Rédige un bloc éditorial SEO destiné à apparaître APRÈS la liste des conférenciers sur la page profil.
Objectif SEO : remonter sur la requête type "[profil] conférencier" et expliquer pourquoi faire appel à l'agence pour ce type d'intervenant.

Tu dois retourner un JSON strict avec ce schéma :
{
  "intro": "Chapô de 200 à 300 mots qui contextualise ce type de profil, son intérêt pour un événement d'entreprise, et le type de prise de parole attendue. Ton éditorial, pas de liste.",
  "sections": [
    { "title": "Pourquoi inviter un [profil] à votre événement", "body": "2-3 paragraphes" },
    { "title": "Dans quels contextes les solliciter", "body": "2-3 paragraphes : séminaires, conventions, kick-off, soirées d'entreprise, formats keynote/atelier/table ronde, etc." },
    { "title": "Notre sélection de profils", "body": "1-2 paragraphes citant 2 à 4 conférenciers de la liste ci-dessus par leur nom + rôle, sans inventer de faits précis", "speaker_ids": ["id1","id2","id3"] }
  ],
  "why_agency": "1 paragraphe (80-120 mots) sur la valeur ajoutée de passer par Les Conférenciers : sourcing sur-mesure, conseil sur le bon profil selon le thème de la conférence, sécurisation logistique, accompagnement de A à Z.",
  "key_points": ["4 à 6 points courts (max 8 mots chacun) résumant la valeur du profil"]
}

Contraintes :
- intro : 200 à 300 mots impérativement
- speaker_ids : utilise les ids exacts depuis la liste fournie : ${JSON.stringify(speakerSummaries.map((s) => ({ id: s.id, name: s.name })))}
- Ne mets aucune balise HTML, aucun markdown
- Apostrophes droites uniquement (')`;

    const raw = await callAI(LOVABLE_API_KEY, system, user);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize: strip HTML, normalize apostrophes
    const clean = (s: any) => normalizeApostrophes(stripHtml(String(s || "")));
    const validIds = new Set(speakerSummaries.map((s) => s.id));

    const rich_content = {
      intro: clean(parsed.intro),
      sections: Array.isArray(parsed.sections)
        ? parsed.sections.slice(0, 6).map((sec: any) => ({
            title: clean(sec.title),
            body: clean(sec.body),
            speaker_ids: Array.isArray(sec.speaker_ids)
              ? sec.speaker_ids.filter((id: any) => validIds.has(id)).slice(0, 6)
              : [],
          }))
        : [],
      why_agency: clean(parsed.why_agency),
      key_points: Array.isArray(parsed.key_points)
        ? parsed.key_points.slice(0, 8).map((p: any) => clean(p)).filter(Boolean)
        : [],
    };

    const { error: uErr } = await supabase
      .from("speaker_profiles")
      .update({ rich_content, rich_content_updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (uErr) {
      return new Response(JSON.stringify({ error: uErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, rich_content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
