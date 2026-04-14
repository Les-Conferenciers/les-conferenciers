import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.lesconferenciers.com";
const NUGGET = `${SITE}/favicon.png`;
const SIGNATURE = `${SITE}/images/les-conferenciers-signature.png`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get today's date in Europe/Paris timezone
    const now = new Date();
    const parisDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const todayStr = `${parisDate.getFullYear()}-${String(parisDate.getMonth() + 1).padStart(2, "0")}-${String(parisDate.getDate()).padStart(2, "0")}`;

    // Fetch pending tasks due today
    const { data: tasks, error: tasksErr } = await supabase
      .from("proposal_tasks")
      .select("*, proposals(client_name, client_email, client_phone, recipient_name)")
      .eq("status", "pending")
      .eq("due_date", todayStr);

    if (tasksErr) {
      return new Response(JSON.stringify({ error: tasksErr.message }), { status: 500, headers: corsHeaders });
    }

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No tasks due today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    // Build task rows HTML
    const taskRows = tasks.map((t: any) => {
      const proposal = t.proposals;
      const taskLabel = t.task_type === "relance_1" ? "Relance 1" : "Relance 2";
      const clientName = proposal?.client_name || "—";
      const clientEmail = proposal?.client_email || "—";
      const clientPhone = proposal?.client_phone || "—";
      const recipientName = proposal?.recipient_name || "";
      const note = t.note ? `<br><em style="color:#888;font-size:12px;">Note : ${t.note}</em>` : "";

      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">
          <strong>${taskLabel}</strong>${note}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">
          ${recipientName ? `${recipientName}<br>` : ""}${clientName}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">
          <a href="mailto:${clientEmail}" style="color:#1a5276;">${clientEmail}</a>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${clientPhone}</td>
      </tr>`;
    }).join("");

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;">
    <div style="background:#1a2332;padding:20px 30px;text-align:center;">
      <img src="${NUGGET}" alt="" style="width:36px;height:36px;display:inline-block;vertical-align:middle;margin-right:12px;" />
      <span style="color:#f5f0e8;font-size:20px;font-weight:bold;vertical-align:middle;font-family:Georgia,serif;">Tâches du jour</span>
    </div>
    <div style="padding:30px;">
      <p style="font-size:16px;color:#333;margin:0 0 20px;">Bonjour Nelly,</p>
      <p style="font-size:14px;color:#555;margin:0 0 20px;">Voici les <strong>${tasks.length} tâche${tasks.length > 1 ? "s" : ""}</strong> prévue${tasks.length > 1 ? "s" : ""} pour aujourd'hui :</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;">
        <thead>
          <tr style="background:#f8f6f1;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Tâche</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Client</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Email</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #ddd;">Téléphone</th>
          </tr>
        </thead>
        <tbody>${taskRows}</tbody>
      </table>
      <p style="font-size:13px;color:#888;margin:20px 0 0;">Ce récapitulatif est envoyé automatiquement chaque matin à 9h.</p>
    </div>
    <div style="padding:0 30px 20px;">
      <img src="${SIGNATURE}" alt="Nelly SABDE" style="width:100%;max-width:500px;display:block;" />
    </div>
    <div style="background:#1a2332;padding:14px;text-align:center;">
      <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Les Conférenciers — Récapitulatif automatique</p>
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: ["nellysabde@lesconferenciers.com"],
        subject: `📋 ${tasks.length} tâche${tasks.length > 1 ? "s" : ""} à faire aujourd'hui — ${todayStr}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, tasks_count: tasks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
