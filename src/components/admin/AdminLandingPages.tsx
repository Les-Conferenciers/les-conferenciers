import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { ExternalLink, Plus, Trash2, Save, ChevronUp, ChevronDown } from "lucide-react";

type FaqItem = { question: string; answer: string };
type Profile = {
  id: string;
  slug: string;
  name: string;
  landing_label: string;
  landing_enabled: boolean;
  seo_title: string | null;
  meta_description: string | null;
  intro_html: string | null;
  faq: FaqItem[];
  display_order: number;
};

const AdminLandingPages = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data: p } = await supabase
      .from("speaker_profiles")
      .select("*")
      .order("display_order");
    const { data: s } = await supabase
      .from("speakers")
      .select("profile_id")
      .eq("archived", false);
    const c: Record<string, number> = {};
    (s || []).forEach((r: any) => { if (r.profile_id) c[r.profile_id] = (c[r.profile_id] || 0) + 1; });
    setCounts(c);
    setProfiles((p || []).map((x: any) => ({ ...x, faq: Array.isArray(x.faq) ? x.faq : [] })));
  };

  useEffect(() => { load(); }, []);

  const updateLocal = (id: string, patch: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const updateFaq = (id: string, faq: FaqItem[]) => updateLocal(id, { faq });

  const save = async (p: Profile) => {
    setSavingId(p.id);
    const { error } = await supabase.from("speaker_profiles").update({
      slug: p.slug,
      name: p.name,
      landing_label: p.landing_label,
      landing_enabled: p.landing_enabled,
      seo_title: p.seo_title,
      meta_description: p.meta_description,
      intro_html: p.intro_html,
      faq: p.faq as any,
      display_order: p.display_order,
    }).eq("id", p.id);
    setSavingId(null);
    if (error) { toast.error("Erreur lors de la sauvegarde"); return; }
    toast.success("Profil enregistré");
  };

  const toggleEnabled = async (p: Profile, enabled: boolean) => {
    updateLocal(p.id, { landing_enabled: enabled });
    const { error } = await supabase.from("speaker_profiles").update({ landing_enabled: enabled }).eq("id", p.id);
    if (error) toast.error("Erreur de toggle");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Active une landing pour faire apparaître la page publique sur <code>/conferencier/profil/&#123;slug&#125;</code>.
      </p>

      <Accordion type="multiple" className="space-y-2">
        {profiles.map(p => (
          <AccordionItem key={p.id} value={p.id} className="border rounded-md px-3">
            <div className="flex items-center gap-3 py-1">
              <Switch
                checked={p.landing_enabled}
                onCheckedChange={(v) => toggleEnabled(p, v)}
                onClick={(e) => e.stopPropagation()}
              />
              <AccordionTrigger className="flex-1 hover:no-underline py-2">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{counts[p.id] || 0} conférencier(s)</span>
                  {p.landing_enabled && (
                    <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent-foreground">Landing active</span>
                  )}
                </div>
              </AccordionTrigger>
              {p.landing_enabled && (
                <a
                  href={`/conferencier/profil/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                  title="Voir la landing"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <AccordionContent className="pt-2 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Slug (URL)</Label>
                  <Input value={p.slug} onChange={e => updateLocal(p.id, { slug: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Nom interne</Label>
                  <Input value={p.name} onChange={e => updateLocal(p.id, { name: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Titre H1 de la landing</Label>
                <Input value={p.landing_label} onChange={e => updateLocal(p.id, { landing_label: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">SEO title</Label>
                <Input value={p.seo_title || ""} onChange={e => updateLocal(p.id, { seo_title: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">Meta description</Label>
                <Textarea rows={2} value={p.meta_description || ""} onChange={e => updateLocal(p.id, { meta_description: e.target.value })} />
              </div>

              <div>
                <Label className="text-xs">Intro (HTML)</Label>
                <Textarea rows={3} value={p.intro_html || ""} onChange={e => updateLocal(p.id, { intro_html: e.target.value })} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">FAQ</Label>
                  <Button
                    type="button" size="sm" variant="outline"
                    onClick={() => updateFaq(p.id, [...p.faq, { question: "", answer: "" }])}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {p.faq.map((item, idx) => (
                    <div key={idx} className="border rounded p-2 space-y-2 bg-muted/20">
                      <div className="flex items-center gap-1">
                        <Input
                          value={item.question}
                          onChange={e => {
                            const next = [...p.faq]; next[idx] = { ...next[idx], question: e.target.value };
                            updateFaq(p.id, next);
                          }}
                          aria-label="Question"
                        />
                        <Button type="button" size="icon" variant="ghost" disabled={idx === 0}
                          onClick={() => {
                            const next = [...p.faq];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            updateFaq(p.id, next);
                          }}><ChevronUp className="h-4 w-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" disabled={idx === p.faq.length - 1}
                          onClick={() => {
                            const next = [...p.faq];
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            updateFaq(p.id, next);
                          }}><ChevronDown className="h-4 w-4" /></Button>
                        <Button type="button" size="icon" variant="ghost"
                          onClick={() => updateFaq(p.id, p.faq.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Textarea
                        rows={2}
                        value={item.answer}
                        onChange={e => {
                          const next = [...p.faq]; next[idx] = { ...next[idx], answer: e.target.value };
                          updateFaq(p.id, next);
                        }}
                        aria-label="Réponse"
                      />
                    </div>
                  ))}
                  {p.faq.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucune question pour l'instant.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={() => save(p)} disabled={savingId === p.id}>
                  <Save className="h-3 w-3 mr-1" /> Enregistrer
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AdminLandingPages;
