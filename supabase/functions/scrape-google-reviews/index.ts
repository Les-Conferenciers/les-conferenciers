const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AVATAR_COLORS = ['#EA4335', '#4285F4', '#34A853', '#FBBC05', '#FF6D01', '#46BDC6', '#7B1FA2', '#C2185B'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Strategy: scrape the Google search results page for reviews
    const searchUrl = 'https://www.google.com/maps/place/Les+Conf%C3%A9renciers/@48.856614,2.3522219,15z/data=!4m8!3m7!1s0x47e66fcd03d2b3b1:0x64bb3a83acbc7f0d!8m2!3d48.8712!4d2.3374!9m1!1b1!16s%2Fg%2F11t3yh0xyp';
    
    console.log('Scraping Google Maps reviews...');
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown'],
        waitFor: 8000,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    console.log('Scraped markdown length:', markdown.length);
    
    // Log a portion to understand structure
    const reviewSection = markdown.substring(0, 5000);
    console.log('Content preview:', reviewSection);

    let reviews = parseGoogleMapsReviews(markdown);
    console.log(`Parsed ${reviews.length} reviews from Maps`);

    // If no reviews from Maps, try scraping the search results page
    if (reviews.length === 0) {
      console.log('Trying alternative scrape...');
      const altResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.google.com/search?q=%22les+conf%C3%A9renciers%22+avis+google',
          formats: ['markdown'],
          waitFor: 5000,
        }),
      });

      const altData = await altResponse.json();
      const altMarkdown = altData.data?.markdown || altData.markdown || '';
      console.log('Alt markdown length:', altMarkdown.length);
      console.log('Alt preview:', altMarkdown.substring(0, 3000));
      
      reviews = parseGoogleMapsReviews(altMarkdown);
      console.log(`Parsed ${reviews.length} reviews from search`);
    }

    // If still no reviews, try JSON extraction
    if (reviews.length === 0) {
      console.log('Trying JSON extraction approach...');
      const jsonResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.google.com/maps/place/Les+Conf%C3%A9renciers/',
          formats: [
            {
              type: 'json',
              prompt: 'Extract all Google reviews from this page. For each review, extract: author_name, rating (1-5), comment (the review text), review_date (the date displayed)',
              schema: {
                type: 'object',
                properties: {
                  reviews: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        author_name: { type: 'string' },
                        rating: { type: 'number' },
                        comment: { type: 'string' },
                        review_date: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          ],
          waitFor: 8000,
        }),
      });

      const jsonData = await jsonResponse.json();
      console.log('JSON extraction result:', JSON.stringify(jsonData).substring(0, 2000));

      const extracted = jsonData.data?.json?.reviews || jsonData.json?.reviews || [];
      if (extracted.length > 0) {
        reviews = extracted.map((r: any) => ({
          author_name: r.author_name || 'Anonyme',
          rating: r.rating || 5,
          comment: r.comment || '',
          review_date: r.review_date || '',
          relative_time: r.review_date || '',
          author_photo_url: null,
        }));
        console.log(`Extracted ${reviews.length} reviews via JSON`);
      }
    }

    if (reviews.length > 0) {
      // Clear existing and insert new
      await fetch(`${supabaseUrl}/rest/v1/google_reviews?id=not.is.null`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal',
        },
      });

      await fetch(`${supabaseUrl}/rest/v1/google_reviews`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(reviews.map((r: any, i: number) => ({
          author_name: r.author_name,
          rating: r.rating,
          comment: r.comment,
          review_date: r.review_date || null,
          relative_time: r.relative_time || null,
          avatar_color: AVATAR_COLORS[i % AVATAR_COLORS.length],
          author_photo_url: r.author_photo_url || null,
        }))),
      });

      console.log(`Inserted ${reviews.length} reviews`);
    }

    return new Response(
      JSON.stringify({ success: true, reviewsCount: reviews.length, reviews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseGoogleMapsReviews(markdown: string) {
  const reviews: any[] = [];
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for patterns like "5 stars" or star ratings
    const starMatch = line.match(/^(\d)\s*(?:stars?|étoiles?)/i);
    if (starMatch) {
      const rating = parseInt(starMatch[1]);
      // Author is typically 1-3 lines before
      let authorName = '';
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const candidate = lines[j].replace(/[*#\[\]!\(\)]/g, '').trim();
        if (candidate.length > 1 && candidate.length < 60 && 
            !candidate.match(/^(local guide|review|photo|google|map|star|étoile|\d)/i)) {
          authorName = candidate;
          break;
        }
      }
      
      // Date and comment are typically after
      let date = '';
      let comment = '';
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const nextLine = lines[j].replace(/[*#\[\]]/g, '').trim();
        if (!date && nextLine.match(/ago|il y a|week|month|year|day|hour|semaine|mois|an|jour|heure|new|nouveau|\d{4}/i)) {
          date = nextLine;
        } else if (nextLine.length > 20 && !nextLine.match(/^(like|share|partager|aimer|visited|visité|\d|local guide|review)/i)) {
          comment = nextLine;
          break;
        }
      }

      if (authorName && rating >= 1 && rating <= 5) {
        reviews.push({
          author_name: authorName,
          rating,
          comment: comment.substring(0, 500),
          review_date: date,
          relative_time: date,
          author_photo_url: null,
        });
      }
    }
  }

  return reviews;
}
