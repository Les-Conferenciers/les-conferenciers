import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Parse conferences from the old site HTML
function parseConferences(html: string): Array<{ title: string; description: string }> {
  const conferences: Array<{ title: string; description: string }> = [];

  // Find the conference tab content (et_pb_tab_1)
  const tabMatch = html.match(
    /class=\"et_pb_tab\s+et_pb_tab_1\s+clearfix\"[\s\S]*?<div\s+class=\"et_pb_tab_content\">([\s\S]*?)<\/div>\s*<\/div>\s*<div\s+class=\"et_pb_tab\s+et_pb_tab_2/
  );

  if (!tabMatch) {
    // Try alternative: look for conference tab without tab_2
    const altMatch = html.match(
      /class=\"et_pb_tab\s+et_pb_tab_1\s+clearfix\"[\s\S]*?<div\s+class=\"et_pb_tab_content\">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/
    );
    if (!altMatch) return conferences;
    return parseConferenceContent(altMatch[1]);
  }

  return parseConferenceContent(tabMatch[1]);
}

function parseConferenceContent(content: string): Array<{ title: string; description: string }> {
  const conferences: Array<{ title: string; description: string }> = [];

  // Split by <h2 class=\"fiche\"> to find conference sections
  const sections = content.split(/<h2[^>]*class=\"fiche\"[^>]*>/i);

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];

    // Extract title (text before closing </h2>)
    const titleMatch = section.match(/^([\s\S]*?)<\/h2>/i);
    if (!titleMatch) continue;

    const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (!title) continue;

    // Extract description (everything after </h2> until end or next section marker)
    let description = section.substring(titleMatch[0].length).trim();

    // Remove conference images (large banners) but keep the text
    description = description.replace(
      /<p>\s*<img[^>]*class=\"[^"]*aligncenter[^"]*size-full[^"]*\"[^>]*>\s*<\/p>/gi,
      ""
    );
    // Also remove standalone img tags that are conference banners
    description = description.replace(
      /<img[^>]*(?:conference|conf[eé]rence|banner)[^>]*>/gi,
      ""
    );
    // Remove lazy-loaded base64 placeholder images
    description = description.replace(
      /<img[^>]*src="data:image[^"]*"[^>]*>/gi,
      ""
    );

    // Clean up empty paragraphs
    description = description.replace(/<p>\s*<\/p>/g, "");
    description = description.trim();

    if (description) {
      conferences.push({ title, description });
    }
  }

  // If no <h2 class=\"fiche\"> sections found, treat the whole content as one conference
  if (conferences.length === 0 && content.trim().length > 50) {
    // Try to find a title in the first line/paragraph
    const firstH2 = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (firstH2) {
      const title = firstH2[1].replace(/<[^>]+>/g, "").trim();
      const desc = content.substring(content.indexOf("</h2>") + 5).trim();
      if (title && desc) {
        conferences.push({ title, description: desc });
      }
    }
  }

  return conferences;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json().catch(() => ({}));
  const slugs: string[] = body.slugs || [];
  const dryRun = body.dry_run || false;

  if (!slugs.length) {
    return new Response(
      JSON.stringify({ error: "No slugs provided" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results: any[] = [];

  for (const slug of slugs) {
    try {
      // Get speaker from DB
      const { data: speaker } = await supabase
        .from("speakers")
        .select("id, name")
        .eq("slug", slug)
        .single();

      if (!speaker) {
        results.push({ slug, error: "Speaker not found in DB" });
        continue;
      }

      // Fetch old site page
      const url = `https://www.lesconferenciers.com/conferencier/${slug}/`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      });

      if (!resp.ok) {
        results.push({ slug, name: speaker.name, error: `HTTP ${resp.status}` });
        continue;
      }

      const html = await resp.text();
      const conferences = parseConferences(html);

      if (conferences.length === 0) {
        results.push({
          slug,
          name: speaker.name,
          conferences_found: 0,
          action: "no_conferences_on_old_site",
        });
        continue;
      }

      if (dryRun) {
        results.push({
          slug,
          name: speaker.name,
          conferences_found: conferences.length,
          titles: conferences.map((c) => c.title),
          action: "dry_run",
        });
        continue;
      }

      // Delete existing conferences for this speaker
      await supabase
        .from("speaker_conferences")
        .delete()
        .eq("speaker_id", speaker.id);

      // Insert new conferences from old site
      let inserted = 0;
      for (let i = 0; i < conferences.length; i++) {
        const conf = conferences[i];
        const { error: insertErr } = await supabase
          .from("speaker_conferences")
          .insert({
            speaker_id: speaker.id,
            title: conf.title,
            description: conf.description,
            display_order: i,
          });
        if (!insertErr) inserted++;
        else console.error(`Insert error for ${slug}/${conf.title}:`, insertErr.message);
      }

      results.push({
        slug,
        name: speaker.name,
        conferences_found: conferences.length,
        inserted,
        action: "imported",
      });

      // Small delay
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      results.push({ slug, error: err.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
