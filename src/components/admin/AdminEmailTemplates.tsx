import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, RotateCcw, Save, Mail, FileCode, FileText } from "lucide-react";
import { EmailPreviewCard, previewSettingsForTemplateKey } from "@/components/admin/EmailPreviewCard";
import { loadEmailTemplates, htmlToPlain, plainToHtml, type EmailFormat } from "@/lib/emailTemplates";


type Variable = { key: string; label: string; example: string };
type Template = {
  id: string;
  key: string;
  name: string;
  category: string;
  trigger_description: string;
  subject: string;
  body_html: string;
  default_subject: string;
  default_body_html: string;
  available_variables: Variable[];
  is_active: boolean;
  format: EmailFormat;
};

const CATEGORY_LABELS: Record<string, string> = {
  lead: "Leads",
  proposal: "Propositions",
  reminder: "Relances",
  contract: "Contrats",
  invoice: "Factures",
  admin: "Notifications internes",
};

export function renderTemplateString(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : `{{${key}}}`
  );
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [format, setFormat] = useState<EmailFormat>("html");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("email_templates" as any)
        .select("*")
        .order("category")
        .order("name");
      if (error) {
        toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
      } else {
        const list = ((data || []) as unknown as Template[]).map((t) => ({
          ...t,
          format: (t.format === "plain" ? "plain" : "html") as EmailFormat,
        }));
        setTemplates(list);
        if (list.length && !selectedId) setSelectedId(list[0].id);
      }
      setLoading(false);
    };
    load();
  }, []);

  const selected = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId]);

  useEffect(() => {
    if (selected) {
      const fmt = (selected.format || "html") as EmailFormat;
      setSubject(selected.subject);
      // Plain templates may still contain residual HTML — strip on display.
      setBody(fmt === "plain" ? htmlToPlain(selected.body_html || "") : selected.body_html);
      setFormat(fmt);
    }
  }, [selectedId]);

  const grouped = useMemo(() => {
    const g: Record<string, Template[]> = {};
    templates.forEach((t) => {
      g[t.category] = g[t.category] || [];
      g[t.category].push(t);
    });
    return g;
  }, [templates]);

  const exampleVars = useMemo(() => {
    if (!selected) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    selected.available_variables.forEach((v) => (map[v.key] = v.example));
    return map;
  }, [selected]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    // Plain templates are stored as plain text in body_html — strip any HTML the user may have pasted.
    const bodyToSave = format === "plain" ? htmlToPlain(body) : body;
    const { error } = await supabase
      .from("email_templates" as any)
      .update({ subject, body_html: bodyToSave, format })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template enregistré" });
      if (format === "plain") setBody(bodyToSave);
      setTemplates((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, subject, body_html: bodyToSave, format } : t))
      );
      // Force-refresh the in-memory cache used by renderTpl across the app
      await loadEmailTemplates(true);
    }
  };

  const handleReset = () => {
    if (!selected) return;
    if (!confirm("Réinitialiser le template à sa version d'origine ?")) return;
    setSubject(selected.default_subject);
    setBody(selected.default_body_html);
  };

  const toggleActive = async () => {
    if (!selected) return;
    const newVal = !selected.is_active;
    const { error } = await supabase
      .from("email_templates" as any)
      .update({ is_active: newVal })
      .eq("id", selected.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setTemplates((prev) => prev.map((t) => (t.id === selected.id ? { ...t, is_active: newVal } : t)));
      await loadEmailTemplates(true);
    }
  };

  const handleSwitchFormat = (next: EmailFormat) => {
    if (next === format) return;
    if (next === "plain") {
      setBody(htmlToPlain(body));
    } else {
      setBody(plainToHtml(body));
    }
    setFormat(next);
  };

  const insertVariable = (key: string) => {
    const tag = `{{${key}}}`;
    const ta = document.getElementById("template-body") as HTMLTextAreaElement | null;
    if (ta) {
      const start = ta.selectionStart || 0;
      const end = ta.selectionEnd || 0;
      const next = body.slice(0, start) + tag + body.slice(end);
      setBody(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + tag.length;
      });
    } else {
      setBody(body + tag);
    }
  };

  if (loading) return <div className="text-muted-foreground">Chargement des templates…</div>;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Liste */}
      <div className="col-span-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" /> {templates.length} templates
        </div>
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">
              {CATEGORY_LABELS[cat] || cat}
            </div>
            <div className="space-y-1">
              {list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-3 py-2 rounded border text-sm transition ${
                    selectedId === t.id
                      ? "bg-primary/10 border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{t.name}</span>
                    {!t.is_active && <Badge variant="outline" className="text-xs">inactif</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{t.key}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Editeur */}
      <div className="col-span-8 space-y-4">
        {!selected ? (
          <div className="text-muted-foreground">Sélectionnez un template à gauche.</div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
              <p className="text-xs text-muted-foreground font-mono">{selected.key}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <div className="font-semibold text-blue-900 mb-1">📌 Déclencheur</div>
              <p className="text-blue-900">{selected.trigger_description}</p>
            </div>

            <div>
              <Label className="text-sm">Sujet</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Corps du message</Label>
                <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => handleSwitchFormat("html")}
                    className={`px-2.5 py-1 flex items-center gap-1.5 transition ${
                      format === "html" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    }`}
                    title="HTML enrichi — accepte balises, mises en forme, liens cliquables"
                  >
                    <FileCode className="h-3.5 w-3.5" /> HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchFormat("plain")}
                    className={`px-2.5 py-1 flex items-center gap-1.5 transition border-l border-border ${
                      format === "plain" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                    }`}
                    title="Texte simple — sauts de ligne préservés, aucune balise"
                  >
                    <FileText className="h-3.5 w-3.5" /> Texte simple
                  </button>
                </div>
              </div>
              <textarea
                id="template-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={18}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {format === "plain"
                  ? "Texte brut. Une ligne vide = nouveau paragraphe. Sera converti en HTML simple à l'envoi."
                  : "HTML autorisé : <p>, <br>, <strong>, <a>, etc."}
              </p>
            </div>


            <div>
              <Label className="text-sm mb-2 block">Variables disponibles (cliquer pour insérer)</Label>
              <div className="flex flex-wrap gap-2">
                {selected.available_variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    title={`${v.label} — ex : ${v.example}`}
                    className="px-2 py-1 rounded bg-muted hover:bg-muted-foreground/20 text-xs font-mono border border-border"
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
                {selected.available_variables.length === 0 && (
                  <span className="text-xs text-muted-foreground">Aucune variable spécifique.</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-1" /> Aperçu
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Réinitialiser
                </Button>
                <Button variant="outline" size="sm" onClick={toggleActive}>
                  {selected.is_active ? "Désactiver" : "Activer"}
                </Button>
              </div>
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu réel — {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const settings = previewSettingsForTemplateKey(selected.key);
            const recipientExample =
              exampleVars.email ||
              exampleVars.email_client ||
              "destinataire@example.com";
            return (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Aperçu rendu avec des valeurs d'exemple pour les variables. C'est exactement la
                  mise en forme reçue par le destinataire.
                </div>
                <EmailPreviewCard
                  to={recipientExample}
                  subject={renderTemplateString(subject, exampleVars)}
                  body={renderTemplateString(body, exampleVars)}
                  variant={settings.variant}
                  showProposalButton={settings.showProposalButton}
                  ctaLabel={settings.ctaLabel}
                />
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

