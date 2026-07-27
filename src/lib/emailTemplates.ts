import { supabase } from "@/integrations/supabase/client";

export type EmailFormat = "html" | "plain";

type TemplateRow = {
  key: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  format?: EmailFormat | null;
};

let cache: Record<string, TemplateRow> = {};
let loaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadEmailTemplates(force = false): Promise<void> {
  if (loaded && !force) return;
  if (loadingPromise && !force) return loadingPromise;
  loadingPromise = (async () => {
    const { data, error } = await supabase
      .from("email_templates" as any)
      .select("key, subject, body_html, is_active, format");
    if (!error && data) {
      cache = Object.fromEntries(
        (data as unknown as TemplateRow[]).map((t) => [t.key, t])
      );
    }
    loaded = true;
    loadingPromise = null;
  })();
  return loadingPromise;
}

// Resolve mustache-style sections {{#var}}…{{/var}} before variable substitution.
// If vars[var] is empty/undefined/null the whole block (typically wrapping a <li>) is stripped.
const resolveSections = (s: string, vars: Record<string, string>): string => {
  const re = /\{\{#\s*([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)\{\{\/\s*\1\s*\}\}/g;
  let prev: string;
  let out = s;
  do {
    prev = out;
    out = out.replace(re, (_m, key: string, inner: string) => {
      const v = vars[key];
      return v !== undefined && v !== null && String(v).trim() !== "" ? inner : "";
    });
  } while (out !== prev);
  return out;
};

// Safety net: remove <li>/<p> that ended up empty after substitution
// (e.g. legacy templates without section syntax where a variable was empty).
const cleanupEmptyBlocks = (s: string): string => {
  let out = s;
  // <strong></strong> or <strong> </strong>
  out = out.replace(/<strong>\s*<\/strong>/gi, "");
  // <li>...</li> whose text content is empty or only whitespace/punctuation
  out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    // Strip if empty, or only label punctuation like "Label :" with no value
    if (!text) return "";
    if (/^[^\wÀ-ÿ]*$/.test(text)) return "";
    if (/:\s*$/.test(text)) return "";
    return m;
  });
  // <p>...</p> emptied out
  out = out.replace(/<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "");
  // Collapse leftover empty <ul></ul>
  out = out.replace(/<ul[^>]*>\s*<\/ul>/gi, "");
  return out;
};

const substitute = (s: string, vars: Record<string, string>) => {
  const sectioned = resolveSections(s, vars);
  const replaced = sectioned.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) =>
    vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{{${k}}}`
  );
  return cleanupEmptyBlocks(replaced);
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function plainToHtml(text: string): string {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

export function htmlToPlain(html: string): string {
  if (!html) return "";
  let s = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|h[1-6]|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Render a template from cache. Returns null if not loaded, missing, or inactive.
 * Call sites must keep their hardcoded fallback for safety.
 * When format is 'plain', body is returned as HTML (plain converted) so it can be
 * injected directly into the rich-text composers used across the app.
 */
export function renderTpl(
  key: string,
  vars: Record<string, string | number | undefined | null>
): { subject: string; body: string; format: EmailFormat } | null {
  const t = cache[key];
  if (!t || !t.is_active) return null;
  const cleanVars: Record<string, string> = {};
  Object.entries(vars).forEach(([k, v]) => {
    cleanVars[k] = v === undefined || v === null ? "" : String(v);
  });
  const format: EmailFormat = (t.format === "plain" ? "plain" : "html");
  const rawBody = substitute(t.body_html || "", cleanVars);
  const body = format === "plain" ? plainToHtml(rawBody) : rawBody;
  return {
    subject: substitute(t.subject || "", cleanVars),
    body,
    format,
  };
}

export function isEmailTemplatesLoaded() {
  return loaded;
}
