import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function slugToWechamp(slug: string): string {
  return `https://www.wechamp-entreprise.co/conferencier/${slug}/`;
}

function extractConferencesFromHtml(html: string): Array<{ title: string; description: string }> {
  const conferences: Array<{ title: string; description: string }> = [];

  // Extract conference titles from carousel h3 tags
  const carouselMatch = html.match(/aria-label=\\\"Conférences effectué[^\\\"]*\\\"[\\\\s\\\\S]*?<\\\\/div>\\\\s*<\\\\/div>/);
  if (!carouselMatch) return [];

  const carouselHtml = carouselMatch[0];

  // Extract unique titles from h3 tags (carousel has duplicates due to cloning)
  const h3Pattern = /<h3>([\\\\s\\\\S]*?)<\\\\/h3>/g;
  const titleSet = new Set<string>();
  const orderedTitles: string[] = [];
  let match;
  while ((match = h3Pattern.exec(carouselHtml)) !== null) {
    const title = match[1].trim().replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/&rsquo;/g, "'").replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
    if (title && !titleSet.has(title)) {
      titleSet.add(title);
      orderedTitles.push(title);
    }
  }

  // Extract modal descriptions
  for (let i = 0; i < orderedTitles.length; i++) {
    const modalId = `modal-conference-${i}`;
    const modalPattern = new RegExp(`id=\\\"${modalId}\\\"[\\\\\\\\s\\\\\\\\S]*?<div class=\\\"modal-body\\\">([\\\\\\\\s\\\\\\\\S]*?)<\\\\\\\\/div>\\\\\\\\s*<\\\\\\\\/div>\\\\\\\\s*<\\\\\\\\/div>`);
    const modalMatch = html.match(modalPattern);
    
    let description = '';
    if (modalMatch) {
      description = modalMatch[1].trim();
      // Clean HTML but keep formatting tags
      description = description.replace(/<a[^>]*>([\\\\s\\\\S]*?)<\\\\/a>/g, '$1'); // Remove links but keep text
      description = description.replace(/&nbsp;/g, ' ');
    }

    conferences.push({
      title: orderedTitles[i],
      description: description || '',
    });
  }

  return conferences;
}

async function reformulateWithAI(speakerName: string, conferences: Array<{ title: string; description: string }>, apiKey: string): Promise<Array<{ title: string; description: string }>> {
  const prompt = `Tu es un rédacteur professionnel pour une agence de conférenciers (Les Conférenciers). 
Reformule les descriptions de conférences suivantes pour les rendre uniques, engageantes et professionnelles.

Règles :
- Garde les titres originaux (tu peux les améliorer légèrement)
- Reformule entièrement chaque description (3-5 phrases) en gardant le sens
- Utilise un ton professionnel et engageant, à la 3e personne
- Mets en gras les mots-clés importants avec <strong>
- Entoure chaque description de balises <p>
- Ne mentionne AUCUN concurrent (WeChamp, Orators, etc.)
- Le contenu doit être 100% original

Conférencier : ${speakerName}

Conférences à reformuler :
${conferences.map((c, i) => `${i + 1}. Titre: "${c.title}"\nDescription originale: ${c.description}`).join('\n\n')}

Réponds en JSON avec ce format exact :
[{"title": "...", "description": "<p>...</p>"}]`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      tools: [{
        type: "function",
        function: {
          name: "save_conferences",
          description: "Save reformulated conference data",
          parameters: {
            type: "object",
            properties: {
              conferences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["title", "description"]
                }
              }
            },
            required: ["conferences"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "save_conferences" } }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    const args = JSON.parse(toolCall.function.arguments);
    return args.conferences;
  }

  // Fallback: try to parse from content
  const content = data.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\[[\\s\\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Could not parse AI response");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const localUrl = Deno.env.get('SUPABASE_URL')!;
    const localServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const client = createClient(localUrl, localServiceKey);

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { speakerIds, dryRun = false, batchSize = 5, offset = 0 } = await req.json().catch(() => ({}));

    // Get speakers without conferences
    let speakersQuery;
    if (speakerIds && Array.isArray(speakerIds) && speakerIds.length > 0) {
      speakersQuery = client.from('speakers').select('id, slug, name').in('id', speakerIds);
    } else {
      // Get all speakers without conferences
      const { data: allSpeakers } = await client.from('speakers').select('id, slug, name').eq('archived', false).order('name');
      const { data: confs } = await client.from('speaker_conferences').select('speaker_id');
      const speakerIdsWithConfs = new Set((confs || []).map(c => c.speaker_id));
      const missing = (allSpeakers || []).filter(s => !speakerIdsWithConfs.has(s.id));
      
      const batch = missing.slice(offset, offset + batchSize);
      const totalMissing = missing.length;
      
      if (batch.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          done: true,
          totalMissing,
          processed: 0,
          results: [],
          next_offset: offset,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const results: any[] = [];
      let totalAdded = 0;

      for (const speaker of batch) {
        try {
          console.log(`Processing: ${speaker.name} (${speaker.slug})`);

          // Try to scrape WeChamp page
          let html = '';
          const wechampUrl = slugToWechamp(speaker.slug);
          
          if (firecrawlApiKey) {
            // Use Firecrawl for better scraping
            const fcResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: wechampUrl, formats: ['html'] }),
            });
            if (fcResp.ok) {
              const fcData = await fcResp.json();
              html = fcData.data?.html || fcData.html || '';
            }
          }

          if (!html) {
            // Direct fetch fallback
            const resp = await fetch(wechampUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConferenceBot/1.0)' },
              redirect: 'follow',
            });
            if (resp.ok) {
              html = await resp.text();
            }
          }

          if (!html || html.includes('404') || html.includes('Page non trouvée')) {
            results.push({ name: speaker.name, slug: speaker.slug, status: 'not_found_on_wechamp' });
            continue;
          }

          const rawConferences = extractConferencesFromHtml(html);
          
          if (rawConferences.length === 0) {
            results.push({ name: speaker.name, slug: speaker.slug, status: 'no_conferences_found' });
            continue;
          }

          console.log(`Found ${rawConferences.length} conferences for ${speaker.name}`);

          // Reformulate with AI
          let reformulated;
          try {
            reformulated = await reformulateWithAI(speaker.name, rawConferences, lovableApiKey);
          } catch (aiErr) {
            console.error(`AI error for ${speaker.name}:`, aiErr);
            // Use raw conferences as fallback (just clean them up)
            reformulated = rawConferences;
          }

          if (!dryRun) {
            const rows = reformulated.map((c, idx) => ({
              speaker_id: speaker.id,
              title: c.title,
              description: c.description,
              display_order: idx,
            }));

            const { error: insertErr } = await client.from('speaker_conferences').insert(rows);
            if (insertErr) {
              results.push({ name: speaker.name, slug: speaker.slug, status: 'insert_error', error: insertErr.message });
              continue;
            }
          }

          totalAdded += reformulated.length;
          results.push({
            name: speaker.name,
            slug: speaker.slug,
            status: 'ok',
            count: reformulated.length,
            titles: reformulated.map(c => c.title),
          });

          // Rate limit pause
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error(`Error for ${speaker.name}:`, err);
          results.push({ name: speaker.name, slug: speaker.slug, status: 'error', error: err.message });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        done: offset + batchSize >= totalMissing,
        totalMissing,
        processed: batch.length,
        totalConferencesAdded: totalAdded,
        next_offset: offset + batchSize,
        results,
      }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
