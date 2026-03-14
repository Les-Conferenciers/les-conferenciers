import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Decode HTML entities
function decodeEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ucirc;/g, "û")
    .replace(/&ecirc;/g, "ê")
    .replace(/&acirc;/g, "â")
    .replace(/&iuml;/g, "ï")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#171;/g, "«")
    .replace(/&#187;/g, "»")
    .replace(/&#160;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

// Clean HTML artifacts from descriptions
function cleanHtml(html: string): string {
  if (!html) return html;
  let cleaned = decodeEntities(html);
  // Remove class attributes like class="p1"
  cleaned = cleaned.replace(/ class="[^"]*"/g, "");
  // Remove empty paragraphs with only whitespace/nbsp
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");
  // Fix nested <p><p> tags
  cleaned = cleaned.replace(/<p>\s*<p>/g, "<p>");
  cleaned = cleaned.replace(/<\/p>\s*<\/p>/g, "</p>");
  return cleaned;
}

// Remove external img tags from bios (ones pointing to lesconferenciers.com)
// and fix broken closing tags like </p> after removed img
function cleanBiography(bio: string): string {
  if (!bio) return bio;
  let cleaned = decodeEntities(bio);
  // Remove <img> tags pointing to external lesconferenciers.com
  cleaned = cleaned.replace(/<img\s+src="https?:\/\/(www\.)?lesconferenciers\.com[^"]*"[^>]*\/?>/g, "");
  // Clean up leftover orphan closing </p> after img removal
  cleaned = cleaned.replace(/\)\s*<\/p>/g, "</p>");
  // Remove class attributes
  cleaned = cleaned.replace(/ class="[^"]*"/g, "");
  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");
  return cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = { conferences_updated: 0, bios_updated: 0, details: [] as string[] };

    // 1. Clean conference titles and descriptions
    const { data: conferences, error: confError } = await supabase
      .from("speaker_conferences")
      .select("id, title, description");
    
    if (confError) throw confError;

    for (const conf of conferences || []) {
      const newTitle = decodeEntities(conf.title);
      const newDesc = conf.description ? cleanHtml(conf.description) : null;
      
      if (newTitle !== conf.title || newDesc !== conf.description) {
        const { error } = await supabase
          .from("speaker_conferences")
          .update({ title: newTitle, description: newDesc })
          .eq("id", conf.id);
        
        if (!error) {
          results.conferences_updated++;
          if (newTitle !== conf.title) {
            results.details.push(`Title fixed: "${conf.title}" → "${newTitle}"`);
          }
        }
      }
    }

    // 2. Clean biographies (decode entities + remove external img tags)
    const { data: speakers, error: spkError } = await supabase
      .from("speakers")
      .select("id, name, biography")
      .not("biography", "is", null);
    
    if (spkError) throw spkError;

    for (const speaker of speakers || []) {
      const newBio = cleanBiography(speaker.biography);
      
      if (newBio !== speaker.biography) {
        const { error } = await supabase
          .from("speakers")
          .update({ biography: newBio })
          .eq("id", speaker.id);
        
        if (!error) {
          results.bios_updated++;
          results.details.push(`Bio cleaned: ${speaker.name}`);
        }
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
