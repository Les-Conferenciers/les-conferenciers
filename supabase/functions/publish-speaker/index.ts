import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function downloadAndUpload(
  supabase: any,
  externalUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    const resp = await fetch(externalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/*,*/*",
      },
    });
    if (!resp.ok) {
      console.error(`Failed to fetch image ${externalUrl}: ${resp.status}`);
      return null;
    }
    const blob = await resp.blob();
    const buffer = new Uint8Array(await blob.arrayBuffer());

    const ext = externalUrl.match(/\.(jpe?g|png|webp)/i)?.[1] || "jpg";
    const contentType =
      blob.type || (ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg");
    const finalName = fileName.includes(".") ? fileName : `${fileName}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("speaker-photos")
      .upload(finalName, buffer, { contentType, upsert: true });

    if (uploadErr) {
      console.error(`Upload error for ${finalName}:`, uploadErr);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("speaker-photos")
      .getPublicUrl(finalName);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`Error downloading ${externalUrl}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { profile, conferences } = body;

    if (!profile?.name || !profile?.slug) {
      return new Response(
        JSON.stringify({ success: false, error: "Nom et slug requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const isExternal = (url: string) =>
      url?.startsWith("http") && !url.includes(supabaseUrl);

    // 1. Upload profile photo
    let imageUrl = profile.photo_url || profile.image_url;
    if (imageUrl && isExternal(imageUrl)) {
      const ext = imageUrl.match(/\.(jpe?g|png|webp)/i)?.[1] || "jpg";
      const uploaded = await downloadAndUpload(supabase, imageUrl, `${profile.slug}.${ext}`);
      if (uploaded) imageUrl = uploaded;
    }

    // 2. Migrate images in conference descriptions
    const migratedConfs = [];
    for (let i = 0; i < (conferences || []).length; i++) {
      const conf = conferences[i];
      let desc = conf.description || "";
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
      const matches = [...desc.matchAll(imgRegex)];
      let imgCounter = 0;

      for (const match of matches) {
        const originalUrl = match[1];
        if (isExternal(originalUrl)) {
          imgCounter++;
          const ext = originalUrl.match(/\.(jpe?g|png|webp)/i)?.[1] || "jpg";
          const fileName = `${profile.slug}-conference-${i + 1}-${imgCounter}.${ext}`;
          const uploaded = await downloadAndUpload(supabase, originalUrl, fileName);
          if (uploaded) {
            desc = desc.replace(originalUrl, uploaded);
          }
        }
      }
      migratedConfs.push({ ...conf, description: desc });
    }

    // 3. Insert speaker
    const { data: speaker, error: insertErr } = await supabase
      .from("speakers")
      .insert({
        name: profile.name,
        slug: profile.slug,
        role: profile.role || null,
        specialty: profile.specialty || null,
        biography: profile.biography || null,
        themes: profile.themes || [],
        languages: profile.languages || ["Français"],
        gender: profile.gender || "male",
        key_points: profile.key_points || [],
        why_expertise: profile.why_expertise || null,
        why_impact: profile.why_impact || null,
        image_url: imageUrl,
        video_url: profile.video_url || null,
        featured: false,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Speaker insert error:", insertErr);
      return new Response(
        JSON.stringify({ success: false, error: insertErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert conferences
    if (migratedConfs.length > 0 && speaker) {
      const confInserts = migratedConfs.map((conf, idx) => ({
        speaker_id: speaker.id,
        title: conf.title,
        description: conf.description || null,
        display_order: idx,
      }));

      const { error: confErr } = await supabase
        .from("speaker_conferences")
        .insert(confInserts);

      if (confErr) console.error("Conference insert error:", confErr);
    }

    console.log(`Published speaker: ${profile.name} (${speaker.id}), ${migratedConfs.length} conferences, image: ${imageUrl}`);

    return new Response(
      JSON.stringify({ success: true, speaker }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Publish error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
