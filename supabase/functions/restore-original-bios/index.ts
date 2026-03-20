import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;

async function scrapeOriginalBio(slug: string): Promise<string | null> {
  const url = `https://www.lesconferenciers.com/conferencier/${slug}/`;
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html'],
        onlyMainContent: false,
      }),
    });

    const data = await response.json();
    const html = data?.data?.html || data?.html || '';
    
    // Extract bio content from the tab content div
    // Pattern: <div class="bio-text">...</div> or content after <h4>Name</h4>
    let bioMatch = html.match(/<div class="bio-text">([\s\S]*?)<\/div>/i);
    if (bioMatch) {
      return bioMatch[1].trim();
    }

    // Alternative: extract from et_pb_tab_content
    bioMatch = html.match(/<div class="et_pb_tab_content">([\s\S]*?)<\/div>\s*<\/div>/i);
    if (bioMatch) {
      let bio = bioMatch[1].trim();
      // Remove the h4 name header
      bio = bio.replace(/<h4[^>]*>[\s\S]*?<\/h4>/gi, '');
      // Remove the bio wrapper divs
      bio = bio.replace(/<div class="bio">\s*/gi, '');
      bio = bio.replace(/<div class="bio-text">\s*/gi, '');
      bio = bio.replace(/<\/div>/gi, '');
      return bio.trim();
    }

    return null;
  } catch (err) {
    console.error(`Error scraping ${slug}:`, err);
    return null;
  }
}

function cleanScrapedBio(html: string): string {
  let clean = html;
  
  // Remove all style attributes
  clean = clean.replace(/\s*style="[^"]*"/gi, '');
  // Remove all data-* attributes
  clean = clean.replace(/\s*data-[a-z-]+="[^"]*"/gi, '');
  // Remove all class attributes
  clean = clean.replace(/\s*class="[^"]*"/gi, '');
  // Remove img tags from within bios (we'll add our own photo)
  clean = clean.replace(/<img[^>]*>/gi, '');
  // Remove &nbsp; → regular space
  clean = clean.replace(/&nbsp;/gi, ' ');
  // Clean up empty tags
  clean = clean.replace(/<p>\s*<\/p>/gi, '');
  // Remove extra whitespace
  clean = clean.replace(/\n{3,}/g, '\n\n');
  
  return clean.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { slugs } = await req.json();
    
    if (!slugs || !Array.isArray(slugs)) {
      return new Response(JSON.stringify({ error: "slugs array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    for (const slug of slugs) {
      // Get current bio to extract the img tag
      const { data: speaker } = await supabase
        .from("speakers")
        .select("id, name, biography")
        .eq("slug", slug)
        .single();

      if (!speaker) {
        results.push(`⏭️ ${slug}: not found`);
        continue;
      }

      // Extract existing img tag from current bio
      const imgMatch = speaker.biography?.match(/<img[^>]*speaker-photos[^>]*\/?>/i);
      const imgTag = imgMatch ? imgMatch[0] : '';

      // Scrape original bio
      const originalBio = await scrapeOriginalBio(slug);
      
      if (!originalBio) {
        results.push(`⚠️ ${speaker.name}: could not scrape original bio`);
        continue;
      }

      const cleanBio = cleanScrapedBio(originalBio);
      
      // Combine: photo + original bio
      const finalBio = imgTag ? `${imgTag}${cleanBio}` : cleanBio;

      const { error: updateError } = await supabase
        .from("speakers")
        .update({ biography: finalBio })
        .eq("id", speaker.id);

      if (updateError) {
        results.push(`❌ ${speaker.name}: ${updateError.message}`);
      } else {
        results.push(`✅ ${speaker.name}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    // Sample check
    const { data: sample } = await supabase
      .from("speakers")
      .select("biography")
      .eq("slug", slugs[0])
      .single();

    return new Response(JSON.stringify({ 
      restored: results.length, 
      results,
      sample_preview: sample?.biography?.substring(0, 500)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
