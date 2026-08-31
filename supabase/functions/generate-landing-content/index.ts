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

// Keep only a safe subset of inline HTML tags
function sanitizeRichHtml(s: string | null | undefined): string {
  if (!s) return "";
  let out = normalizeApostrophes(String(s));
  // remove scripts/styles
  out = out.replace(/<\/?(script|style|meta|link|font)[^>]*>/gi, "");
  // strip attributes from allowed tags (keep only tag name)
  out = out.replace(/<(\/?)(p|strong|em|ul|ol|li|br)(\s[^>]*)?>/gi, "<$1$2>");
  // remove any other tag
  out = out.replace(/<(?!\/?(p|strong|em|ul|ol|li|br)\b)[^>]+>/gi, "");
  return out.trim();
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

    const { profile_id, part, section_index, instructions } = await req.json();
    if (!profile_id) {
      return new Response(JSON.stringify({ error: "profile_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: pErr } = await supabase
      .from("speaker_profiles")
      .select("id, name, landing_label, subtitle, linked_profile_ids, extra_speaker_ids, rich_content")
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

    const profileLabel = profile.landing_label || profile.name;

    const system = `Tu es la plume éditoriale de l'agence francophone "Les Conférenciers" (https://www.lesconferenciers.com), agence premium de conférenciers.
Ton : professionnel, premium, factuel, chaleureux, jamais commercial agressif, jamais "wow". Français impeccable. Toujours apostrophes droites (').
Interdictions absolues :
- Pas de plagiat, ne reprends jamais la formulation d'un site concurrent (wechamp, etc.)
- Ne cite jamais d'agence concurrente
- Pas d'invention de faits sur des personnes nommées (reste générique sur leur apport)
- Pas de superlatifs vides ("incroyable", "exceptionnel à couper le souffle")
- Pas de mise en gras automatique (n'utilise pas <strong>)
HTML autorisé UNIQUEMENT : <p>, <em>, <ul>, <ol>, <li>, <br>. Aucun autre tag, aucun attribut, aucune classe.
Tu réponds STRICTEMENT en JSON valide, sans texte autour.`;

    const user = `Profil de landing : "${profileLabel}"
${profile.subtitle ? `Sous-titre : ${profile.subtitle}` : ""}

Conférenciers représentatifs disponibles dans ce profil (pour exemples concrets) :
${speakerSummaries.map((s) => `- ${s.name}${s.role ? ` (${s.role})` : ""}`).join("\n")}

Rédige un bloc éditorial SEO destiné à apparaître APRÈS la liste des conférenciers sur la page profil.
Objectif SEO : remonter sur la requête type "${profileLabel} conférencier" et expliquer pourquoi faire appel à l'agence pour ce type d'intervenant.

Tu dois retourner un JSON strict avec ce schéma :
{
  "intro": "",
  "key_points_title": "Titre court (max 8 mots) qui contextualise les points clés, par exemple : 'Ce que ces profils apportent à votre événement'",
  "key_points_intro": "Une phrase (max 25 mots) qui pose le décor des bénéfices.",
  "key_points": [
    { "label": "Titre court de la carte (3 à 6 mots)", "description": "Une phrase d'appui (15-25 mots) qui développe le bénéfice concret pour l'événement." }
  ],
  "sections": [
    { "title": "Sous-titre court", "body": "<p>...</p><p>...</p>" }
  ],
  "why_agency": "<p>...</p><p>...</p> — 2 paragraphes (120-180 mots au total). Insiste IMPÉRATIVEMENT sur 3 axes : 1) la connaissance fine de chaque conférencier (rencontres, briefs, suivi), 2) la maîtrise du contenu de leurs conférences (sujets, angles, formats, exemples), 3) l'expertise de matching entre un événement, son audience, ses objectifs et le bon conférencier. Évite les généralités vagues type 'accompagnement de A à Z'."
}

Contraintes :
- intro : laisser une chaîne vide "" (le chapô a été retiré de la page publique).
- key_points : 4 à 6 cartes maximum.
- sections : 2 à 4 sous-parties qui seront affichées en CONTINU sous un unique titre "Pourquoi inviter un·e ${profileLabel} à votre événement". Couvre : pourquoi inviter ce type de profil, les contextes d'intervention (séminaires, conventions, kick-off, soirées, formats keynote/atelier/table ronde…), les typologies de profils dans cette catégorie. NE cite PAS de noms de conférenciers individuels (la sélection est déjà affichée en haut de page). Pas de champ speaker_ids.
- HTML autorisé : <p>, <em>, <ul>, <ol>, <li>, <br>. PAS de <strong>, PAS de classes, PAS d'attributs.
- Apostrophes droites uniquement (')`;

    const existing: any = (profile as any).rich_content || {};
    const existingSections: any[] = Array.isArray(existing.sections) ? existing.sections : [];
    const speakerListText = speakerSummaries
      .map((s) => `- ${s.name}${s.role ? ` (${s.role})` : ""}`)
      .join("\n");

    const contextHeader = `Profil de landing : "${profileLabel}"
${profile.subtitle ? `Sous-titre : ${profile.subtitle}` : ""}

Conférenciers sélectionnés dans ce profil (sélection réellement affichée sur la page) :
${speakerListText}
`;

    const extraInstructions = instructions
      ? `\nConsignes complémentaires de l'éditrice (prioritaires) : ${String(instructions).slice(0, 800)}\n`
      : "";

    let promptUser = user;

    if (part === "key_points") {
      promptUser = `${contextHeader}${extraInstructions}
Régénère UNIQUEMENT le bloc "points clés" de la page profil.
Retourne un JSON strict :
{ "key_points_title": "", "key_points_intro": "", "key_points": [ { "label": "", "description": "" } ] }
Contraintes : 4 à 6 cartes, label 3-6 mots, description 15-25 mots, texte brut sans HTML, apostrophes droites.`;
    } else if (part === "why_agency") {
      promptUser = `${contextHeader}${extraInstructions}
Régénère UNIQUEMENT le bloc "pourquoi passer par l'agence".
Retourne un JSON strict : { "why_agency": "<p>...</p><p>...</p>" }
Contraintes : 2 paragraphes (120-180 mots au total), 3 axes obligatoires : connaissance fine de chaque conférencier, maîtrise du contenu de leurs conférences, expertise de matching événement/audience/objectifs. HTML autorisé : <p>, <em>, <ul>, <ol>, <li>, <br>. Pas de <strong>.`;
    } else if (part === "section") {
      const idx = Number(section_index);
      const current = existingSections[idx];
      if (!current) {
        return new Response(JSON.stringify({ error: "Section introuvable" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const others = existingSections
        .filter((_, i) => i !== idx)
        .map((s: any) => `- ${s.title}`)
        .join("\n");
      promptUser = `${contextHeader}${extraInstructions}
Régénère UNIQUEMENT la section suivante de la page profil.
Titre actuel de la section : "${current.title || "(sans titre)"}"
Contenu actuel (à remplacer, pour contexte) : ${stripHtml(current.body).slice(0, 800)}

Autres sections déjà présentes (ne pas répéter leur contenu) :
${others || "(aucune)"}

Retourne un JSON strict : { "title": "", "body": "<p>...</p><p>...</p>" }
Contraintes : garde un titre proche du titre actuel s'il est pertinent, 150-250 mots, cohérent avec la sélection de conférenciers ci-dessus (tu peux citer des noms de la sélection si la section porte explicitement sur cette sélection). HTML autorisé : <p>, <em>, <ul>, <ol>, <li>, <br>. Pas de <strong>. Apostrophes droites.`;
    }

    const raw = await callAI(LOVABLE_API_KEY, system, promptUser);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validIds = new Set(speakerSummaries.map((s) => s.id));
    const cleanText = (s: any) => normalizeApostrophes(stripHtml(String(s || "")));

    const buildKeyPoints = (input: any) => {
      const rawKeyPoints = Array.isArray(input) ? input : [];
      return rawKeyPoints.slice(0, 6).map((p: any) => {
        if (typeof p === "string") return { label: cleanText(p), description: "" };
        return { label: cleanText(p?.label), description: cleanText(p?.description) };
      }).filter((p: any) => p.label);
    };

    let rich_content: any;

    if (part === "key_points") {
      rich_content = {
        ...existing,
        key_points_title: cleanText(parsed.key_points_title) || existing.key_points_title || "",
        key_points_intro: cleanText(parsed.key_points_intro) || existing.key_points_intro || "",
        key_points: buildKeyPoints(parsed.key_points),
      };
    } else if (part === "why_agency") {
      rich_content = { ...existing, why_agency: sanitizeRichHtml(parsed.why_agency) };
    } else if (part === "section") {
      const idx = Number(section_index);
      const nextSections = existingSections.map((s: any, i: number) =>
        i === idx
          ? {
              ...s,
              title: cleanText(parsed.title) || s.title,
              body: sanitizeRichHtml(parsed.body) || s.body,
            }
          : s
      );
      rich_content = { ...existing, sections: nextSections };
    } else {
      rich_content = {
        intro: sanitizeRichHtml(parsed.intro),
        key_points_title: cleanText(parsed.key_points_title),
        key_points_intro: cleanText(parsed.key_points_intro),
        key_points: buildKeyPoints(parsed.key_points),
        sections: Array.isArray(parsed.sections)
          ? parsed.sections.slice(0, 6).map((sec: any) => ({
              title: cleanText(sec.title),
              body: sanitizeRichHtml(sec.body),
              speaker_ids: Array.isArray(sec.speaker_ids)
                ? sec.speaker_ids.filter((id: any) => validIds.has(id)).slice(0, 6)
                : [],
            }))
          : [],
        why_agency: sanitizeRichHtml(parsed.why_agency),
      };
    }

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
