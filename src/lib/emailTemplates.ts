import { supabase } from "@/integrations/supabase/client";

type TemplateRow = { key: string; subject: string; body_html: string; is_active: boolean };

let cache: Record<string, TemplateRow> = {};
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadEmailTemplates(force = false): Promise<void> {
  if (loaded && !force) return;
  if (loadingPromise && !force) return loadingPromise;
  loadingPromise = (async () => {
    const { data, error } = await supabase
      .from("email_templates" as any)
      .select("key, subject, body_html, is_active");
    if (!error && data) {
      cache = Object.fromEntries(
        (data as unknown as TemplateRow[]).map((t) => [t.key, t])
      );
    }
    loaded = true;
  })();
  return loadingPromise;
}

const substitute = (s: string, vars: Record<string, string>) =>
  s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{{${k}}}`));

/**
 * Render a template from cache. Returns null if not loaded, missing, or inactive.
 * Call sites must keep their hardcoded fallback for safety.
 */
export function renderTpl(
  key: string,
  vars: Record<string, string | number | undefined | null>
): { subject: string; body: string } | null {
  const t = cache[key];
  if (!t || !t.is_active) return null;
  const cleanVars: Record<string, string> = {};
  Object.entries(vars).forEach(([k, v]) => {
    cleanVars[k] = v === undefined || v === null ? "" : String(v);
  });
  return {
    subject: substitute(t.subject || "", cleanVars),
    body: substitute(t.body_html || "", cleanVars),
  };
}

export function isEmailTemplatesLoaded() {
  return loaded;
}
