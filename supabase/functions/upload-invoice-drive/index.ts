import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const ROOT_NAME = "Factures payées";
const FOLDER_MIME = "application/vnd.google-apps.folder";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const DRIVE_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!LOVABLE_API_KEY || !DRIVE_KEY) return json({ error: "Google Drive non connecté" }, 500);
  const headers = { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": DRIVE_KEY };

  let invoiceId = "";
  try {
    const body = await req.json();
    invoiceId = String(body?.invoice_id || "");
    const pdfBase64 = String(body?.pdf_base64 || "");
    const fileName = String(body?.file_name || "facture.pdf").replace(/[\\/:*?"<>|]/g, "-").slice(0, 200);
    if (!/^[0-9a-f-]{36}$/i.test(invoiceId) || pdfBase64.length < 100) return json({ error: "Requête invalide" }, 400);

    const { data: inv, error: invErr } = await supabase.from("invoices").select("id, paid_at").eq("id", invoiceId).maybeSingle();
    if (invErr || !inv) return json({ error: "Facture introuvable" }, 404);
    const paid = inv.paid_at ? new Date(inv.paid_at) : new Date();
    const month = `${paid.getFullYear()}-${String(paid.getMonth() + 1).padStart(2, "0")}`;

    const findOrCreate = async (name: string, parent: string) => {
      const q = `name='${name.replace(/'/g, "\\'")}' and '${parent}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`;
      const r = await fetch(`${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`, { headers });
      if (!r.ok) throw new Error(`Recherche dossier [${r.status}]: ${await r.text()}`);
      const found = (await r.json()).files?.[0]?.id;
      if (found) return found as string;
      const c = await fetch(`${GATEWAY}/drive/v3/files?fields=id`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parent] }),
      });
      if (!c.ok) throw new Error(`Création dossier [${c.status}]: ${await c.text()}`);
      return (await c.json()).id as string;
    };

    const rootId = await findOrCreate(ROOT_NAME, "root");
    const monthId = await findOrCreate(month, rootId);

    const bytes = Uint8Array.from(atob(pdfBase64), (ch) => ch.charCodeAt(0));
    const boundary = "invb" + crypto.randomUUID();
    const meta = JSON.stringify({ name: fileName, parents: [monthId], mimeType: "application/pdf" });
    const enc = new TextEncoder();
    const pre = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`);
    const post = enc.encode(`\r\n--${boundary}--`);
    const payload = new Uint8Array(pre.length + bytes.length + post.length);
    payload.set(pre, 0); payload.set(bytes, pre.length); payload.set(post, pre.length + bytes.length);

    const up = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: { ...headers, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: payload,
    });
    if (!up.ok) throw new Error(`Upload [${up.status}]: ${await up.text()}`);
    const file = await up.json();

    await supabase.from("invoices").update({
      drive_file_id: file.id, drive_file_url: file.webViewLink || null,
      drive_uploaded_at: new Date().toISOString(), drive_error: null,
    }).eq("id", invoiceId);

    return json({ ok: true, file_id: file.id, url: file.webViewLink, folder: `${ROOT_NAME}/${month}` });
  } catch (e: any) {
    console.error("upload-invoice-drive error:", e?.message);
    if (invoiceId) await supabase.from("invoices").update({ drive_error: String(e?.message || e).slice(0, 500) }).eq("id", invoiceId);
    return json({ error: String(e?.message || e) }, 500);
  }
});
