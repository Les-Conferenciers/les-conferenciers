import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

function extractLocation(html: string): string | null {
  // Pattern 1: Look for "Localisation" label followed by icon-list with map marker
  const locBlock =
    html.match(/Localisation[\s\S]{0,500}?elementor-icon-list-text[^>]*>([^<]+)</i);
  if (locBlock?.[1]) {
    return locBlock[1].trim();
  }

  // Pattern 2: Look for fas-map-marker followed by text
  const mapMarker =
    html.match(/e-fas-map-marker[\s\S]{0,300}?elementor-icon-list-text[^>]*>([^<]+)</i);
  if (mapMarker?.[1]) {
    return mapMarker[1].trim();
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all speakers without city
    const { data: speakers, error } = await supabase
      .from("speakers")
      .select("id, name, slug, city")
      .eq("archived", false)
      .order("name");

    if (error) throw error;

    const results: { name: string; city: string | null; status: string }[] = [];
    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < speakers.length; i += batchSize) {
      const batch = speakers.slice(i, i + batchSize);

      const promises = batch.map(async (speaker) => {
        // Skip if already has city
        if (speaker.city) {
          skipped++;
          return { name: speaker.name, city: speaker.city, status: "skipped (already set)" };
        }

        const oratorsSlug = slugify(speaker.name);
        const url = `https://orators.fr/les-intervenants/${oratorsSlug}/`;
        const html = await fetchPage(url);

        if (!html) {
          notFound++;
          return { name: speaker.name, city: null, status: "page not found" };
        }

        const location = extractLocation(html);

        if (location) {
          // Extract just the city part (before comma or "France")
          const cityPart = location.split(",")[0].trim();

          const { error: updateErr } = await supabase
            .from("speakers")
            .update({ city: cityPart })
            .eq("id", speaker.id);

          if (updateErr) {
            return { name: speaker.name, city: null, status: `error: ${updateErr.message}` };
          }

          updated++;
          return { name: speaker.name, city: cityPart, status: "updated" };
        }

        notFound++;
        return { name: speaker.name, city: null, status: "location not found on page" };
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < speakers.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`Scrape locations done: ${updated} updated, ${skipped} skipped, ${notFound} not found`);

    return new Response(
      JSON.stringify({
        success: true,
        total: speakers.length,
        updated,
        skipped,
        notFound,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scrape locations error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
