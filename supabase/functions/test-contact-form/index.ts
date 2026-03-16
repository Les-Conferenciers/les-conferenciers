import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    }

    // Call the send-contact-email function with test data
    const testPayload = {
      name: "[TEST QUOTIDIEN] Vérification automatique",
      email: "test@lesconferenciers.com",
      company: "Test automatique",
      phone: "",
      eventDate: "",
      eventType: "Test",
      message: `Ceci est un test automatique quotidien du formulaire de contact. Date: ${new Date().toISOString()}. Si vous recevez cet email, le formulaire fonctionne correctement.`,
    };

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-contact-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testPayload),
    });

    const result = await res.json();

    if (!res.ok) {
      // Send alert email if the form is broken
      if (RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
            to: ["nellysabde@lesconferenciers.com"],
            subject: "⚠️ ALERTE - Le formulaire de contact ne fonctionne plus !",
            text: `Le test automatique quotidien du formulaire de contact a échoué.\n\nDate: ${new Date().toISOString()}\nErreur: ${JSON.stringify(result)}\nStatut HTTP: ${res.status}\n\nVeuillez vérifier le fonctionnement du site.`,
          }),
        });
      }

      console.error("Contact form test FAILED:", res.status, result);
      return new Response(JSON.stringify({ success: false, error: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Contact form test PASSED at", new Date().toISOString());
    return new Response(JSON.stringify({ success: true, message: "Contact form test passed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in test-contact-form:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
