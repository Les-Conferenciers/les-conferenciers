const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AVATAR_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01', '#46BDC6', '#7B1FA2', '#C2185B'];

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

    // Scrape Google Maps reviews page for "Les Conférenciers"
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.google.com/maps/place/Les+Conf%C3%A9renciers/@48.8566,2.3522,15z/data=!4m8!3m7!1s0x47e66e2964e34e2d:0x8ddca9ee380ef7e0!8m2!3d48.8566!4d2.3522!9m1!1b1!16s%2Fg%2F11c1p_rnp7',
        formats: ['markdown'],
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      throw new Error(`Firecrawl failed: ${JSON.stringify(scrapeData)}`);
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    console.log('Scraped markdown length:', markdown.length);
    console.log('Markdown preview:', markdown.substring(0, 2000));

    // Parse reviews from the markdown
    const reviews = parseReviews(markdown);
    console.log(`Parsed ${reviews.length} reviews`);

    if (reviews.length === 0) {
      // Try alternative: search for the reviews
      console.log('No reviews parsed from scrape, trying search approach...');
      
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Les Conférenciers avis Google site:google.com/maps',
          limit: 1,
          scrapeOptions: { formats: ['markdown'] },
        }),
      });

      const searchData = await searchResponse.json();
      if (searchData.data?.[0]?.markdown) {
        const altReviews = parseReviews(searchData.data[0].markdown);
        console.log(`Parsed ${altReviews.length} reviews from search`);
        if (altReviews.length > 0) {
          reviews.push(...altReviews);
        }
      }
    }

    if (reviews.length > 0) {
      // Clear existing reviews and insert new ones
      await fetch(`${supabaseUrl}/rest/v1/google_reviews`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        // Delete all
        body: undefined,
      });

      // Actually need to use query param for delete all
      await fetch(`${supabaseUrl}/rest/v1/google_reviews?id=not.is.null`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal',
        },
      });

      // Insert new reviews
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/google_reviews`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(reviews.map((r, i) => ({
          author_name: r.author_name,
          rating: r.rating,
          comment: r.comment,
          review_date: r.review_date,
          relative_time: r.relative_time,
          avatar_color: AVATAR_COLORS[i % AVATAR_COLORS.length],
          author_photo_url: r.author_photo_url || null,
        }))),
      });

      const insertData = await insertResponse.json();
      console.log('Inserted reviews:', insertData.length);
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

function parseReviews(markdown: string) {
  const reviews: any[] = [];
  
  // Try various patterns to extract reviews from Google Maps markdown
  // Pattern 1: "Name\nX stars\nDate\nComment"
  const starPattern = /([^\n]+)\n(\d)\s*(?:star|étoile|★)/gi;
  let match;
  
  // Pattern 2: Look for review blocks with ratings
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Look for star ratings (e.g., "5 stars", "★★★★★", "5/5")
    const starMatch = line.match(/^(\d)\s*(?:star|étoile|\/5)/i) || 
                       line.match(/^(★{1,5})/) ||
                       line.match(/(\d)\s*(?:star|étoile)/i);
    
    if (starMatch) {
      const rating = starMatch[1].length > 1 ? starMatch[1].length : parseInt(starMatch[1]);
      // Look backwards for author name
      const authorName = i > 0 ? lines[i - 1] : 'Anonyme';
      // Look forward for date and comment
      let date = '';
      let comment = '';
      
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.match(/ago|il y a|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\d{4}/i)) {
          date = nextLine;
          if (i + 2 < lines.length) {
            comment = lines[i + 2];
          }
        } else {
          comment = nextLine;
        }
      }
      
      if (authorName && !authorName.match(/^(google|map|avis|review|note)/i) && rating >= 1 && rating <= 5) {
        reviews.push({
          author_name: authorName.replace(/[*#\[\]]/g, '').trim(),
          rating,
          comment: comment.replace(/[*#\[\]]/g, '').trim().substring(0, 500),
          review_date: date,
          relative_time: date,
          author_photo_url: null,
        });
      }
    }
    i++;
  }
  
  return reviews;
}
