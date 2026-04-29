import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, pdf_base64, file_name } = await req.json();
    if (!token || !pdf_base64) {
      return new Response(JSON.stringify({ error: "Missing token or pdf_base64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate token -> contract
    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("id, status")
      .eq("token", token)
      .maybeSingle();
    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const binary = Uint8Array.from(atob(pdf_base64), (c) => c.charCodeAt(0));
    const path = `${contract.id}/${Date.now()}-signed.pdf`;
    const safeName = file_name || `Contrat-signe-${contract.id.slice(0, 8)}.pdf`;

    const { error: upErr } = await supabase.storage
      .from("signed-contracts")
      .upload(path, binary, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      console.error("upload error", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("signed_contract_files").insert({
      contract_id: contract.id,
      file_name: safeName,
      file_path: path,
      file_size: binary.byteLength,
      mime_type: "application/pdf",
    });

    return new Response(JSON.stringify({ success: true, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
