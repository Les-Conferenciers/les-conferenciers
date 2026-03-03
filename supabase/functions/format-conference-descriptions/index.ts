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

  // Get all conferences without HTML formatting
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
    
    // Skip if already has HTML paragraph tags
    if (/<p>|<br\s*\/?>/.test(desc)) {
      skipped++;
      continue;
    }
    
    // Skip very short descriptions
    if (desc.length < 50) {
      skipped++;
      continue;
    }

    const newDesc = formatPlainTextToHtml(desc);
    
    if (newDesc !== desc) {
      const { error: updateErr } = await supabase
        .from("speaker_conferences")
        .update({ description: newDesc })
        .eq("id", conf.id);
      
      if (updateErr) {
        errors.push(`${conf.id}: ${updateErr.message}`);
      } else {
        formatted++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`Formatted: ${formatted}, Skipped: ${skipped}, Errors: ${errors.length}`);

  return new Response(
    JSON.stringify({ success: true, formatted, skipped, errors, total: conferences?.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
