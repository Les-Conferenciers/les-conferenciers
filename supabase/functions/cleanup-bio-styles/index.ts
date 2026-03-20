import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanBiography(bio: string): string {
  let clean = bio;

  // Preserve <img> tags as-is (they have valid classes)
  const imgTags: string[] = [];
  clean = clean.replace(/<img[^>]*\/?\s*>/gi, (match) => {
    imgTags.push(match);
    return `__IMG_PLACEHOLDER_${imgTags.length - 1}__`;
  });

  // Replace <h4> with <p>
  clean = clean.replace(/<h4[^>]*>/gi, '<p>');
  clean = clean.replace(/<\/h4>/gi, '</p>');

  // Remove Apple-converted-space spans → replace with a space
  clean = clean.replace(/<span class=\"Apple-converted-space\"[^>]*>\s*&nbsp;\s*<\/span>/gi, ' ');
  clean = clean.replace(/<span class=\"Apple-converted-space\"[^>]*>[^<]*<\/span>/gi, ' ');

  // Remove all style attributes
  clean = clean.replace(/\s*style=\"[^"]*\"/gi, '');

  // Remove all data-* attributes
  clean = clean.replace(/\s*data-[a-z-]+=\"[^"]*\"/gi, '');

  // Remove all class attributes from non-img elements (spans, p, strong, etc.)
  // We do this by removing class from all tags, then restoring img
  clean = clean.replace(/\s*class=\"[^"]*\"/gi, '');

  // Remove empty <span> wrappers (keeping their content)
  // Repeatedly to handle nested spans
  for (let i = 0; i < 5; i++) {
    clean = clean.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1');
  }

  // Clean up &nbsp; → regular space
  clean = clean.replace(/&nbsp;/gi, ' ');

  // Clean up multiple consecutive spaces
  clean = clean.replace(/  +/g, ' ');

  // Restore img tags
  imgTags.forEach((img, i) => {
    clean = clean.replace(`__IMG_PLACEHOLDER_${i}__`, img);
  });

  // Trim whitespace inside tags
  clean = clean.replace(/>\s+</g, '><');
  // But keep space between text and tags
  clean = clean.replace(/<\/strong>(\w)/g, '</strong> $1');
  clean = clean.replace(/(\w)<strong/g, '$1 <strong');
  clean = clean.replace(/<\/p>\s*<p>/g, '</p>\n\n<p>');

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

    const { data: speakers, error } = await supabase
      .from("speakers")
      .select("id, name, slug, biography")
      .or("biography.like.%data-start%,biography.like.%Apple-converted-space%,biography.like.%caret-color%,biography.like.%<h4>%,biography.like.%style=\"%");

    if (error) throw error;

    const results: string[] = [];

    for (const speaker of speakers || []) {
      if (!speaker.biography) continue;

      const cleaned = cleanBiography(speaker.biography);

      if (cleaned !== speaker.biography) {
        const { error: updateError } = await supabase
          .from("speakers")
          .update({ biography: cleaned })
          .eq("id", speaker.id);

        if (updateError) {
          results.push(`❌ ${speaker.name}: ${updateError.message}`);
        } else {
          results.push(`✅ ${speaker.name}`);
        }
      }
    }

    // Verify sample
    const { data: sample } = await supabase
      .from("speakers")
      .select("name, biography")
      .eq("slug", "hapsatou-sy")
      .single();

    return new Response(JSON.stringify({ 
      cleaned: results.length, 
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
