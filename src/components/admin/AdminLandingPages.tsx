import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ExternalLink, Eye, Plus, Trash2, Save, ChevronUp, ChevronDown, X, Sparkles, Loader2 } from "lucide-react";

type FaqItem = { question: string; answer: string };
type RichSection = { title: string; body: string; speaker_ids?: string[] };
type RichContent = {
  intro: string;
  sections: RichSection[];
  why_agency: string;
  key_points: string[];
};
type Profile = {
  id: string;
  slug: string;
  name: string;
  landing_label: string;
  landing_enabled: boolean;
  seo_title: string | null;
  meta_description: string | null;
  intro_html: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_button_label: string | null;
  linked_profile_ids: string[];
  extra_speaker_ids: string[];
  faq: FaqItem[];
  display_order: number;
  rich_content: RichContent | null;
  rich_content_updated_at: string | null;
};

type SpeakerLite = { id: string; name: string; role: string | null; profile_id: string | null };

const AdminLandingPages = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [allSpeakers, setAllSpeakers] = useState<SpeakerLite[]>([]);
  const [search, setSearch] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: p } = await supabase
      .from("speaker_profiles")
      .select("*")
      .order("display_order");
    const { data: s } = await supabase
      .from("speakers")
      .select("id, name, role, profile_id, archived")
      .eq("archived", false);
    const c: Record<string, number> = {};
    (s || []).forEach((r: any) => { if (r.profile_id) c[r.profile_id] = (c[r.profile_id] || 0) + 1; });
    setCounts(c);
    setAllSpeakers((s || []).map((r: any) => ({ id: r.id, name: r.name, role: r.role, profile_id: r.profile_id })));
    setProfiles((p || []).map((x: any) => ({
      ...x,
      faq: Array.isArray(x.faq) ? x.faq : [],
      linked_profile_ids: x.linked_profile_ids || [],
      extra_speaker_ids: x.extra_speaker_ids || [],
      rich_content: x.rich_content || null,
      rich_content_updated_at: x.rich_content_updated_at || null,
    })));
  };

  useEffect(() => { load(); }, []);

  const speakerById = useMemo(() => {
    const m = new Map<string, SpeakerLite>();
    allSpeakers.forEach(s => m.set(s.id, s));
    return m;
  }, [allSpeakers]);

  const updateLocal = (id: string, patch: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

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
      subtitle: p.subtitle,
      cta_text: p.cta_text,
      cta_button_label: p.cta_button_label,
      linked_profile_ids: p.linked_profile_ids,
      extra_speaker_ids: p.extra_speaker_ids,
      faq: p.faq as any,
      display_order: p.display_order,
      rich_content: (p.rich_content as any) ?? null,
    } as any).eq("id", p.id);
    setSavingId(null);
    if (error) { toast.error("Erreur lors de la sauvegarde"); return; }
    toast.success("Profil enregistré");
  };

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const generateRich = async (p: Profile) => {
    setGeneratingId(p.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-landing-content", {
        body: { profile_id: p.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const rc = (data as any).rich_content as RichContent;
      updateLocal(p.id, { rich_content: rc, rich_content_updated_at: new Date().toISOString() });
      toast.success("Contenu éditorial généré");
    } catch (e: any) {
      toast.error(`Génération échouée : ${e.message || e}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const updateRich = (p: Profile, patch: Partial<RichContent>) => {
    const base: RichContent = p.rich_content || { intro: "", sections: [], why_agency: "", key_points: [] };
    updateLocal(p.id, { rich_content: { ...base, ...patch } });
  };

  const toggleEnabled = async (p: Profile, enabled: boolean) => {
    updateLocal(p.id, { landing_enabled: enabled });
    const { error } = await supabase.from("speaker_profiles").update({ landing_enabled: enabled }).eq("id", p.id);
    if (error) toast.error("Erreur de toggle");
  };

  const toggleLinked = (p: Profile, otherId: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...(p.linked_profile_ids || []), otherId]))
      : (p.linked_profile_ids || []).filter(x => x !== otherId);
    updateLocal(p.id, { linked_profile_ids: next });
  };

  const addExtra = (p: Profile, speakerId: string) => {
    if (!speakerId) return;
    if (p.extra_speaker_ids.includes(speakerId)) return;
    updateLocal(p.id, { extra_speaker_ids: [...p.extra_speaker_ids, speakerId] });
    setSearch(s => ({ ...s, [p.id]: "" }));
  };

  const removeExtra = (p: Profile, speakerId: string) => {
    updateLocal(p.id, { extra_speaker_ids: p.extra_speaker_ids.filter(x => x !== speakerId) });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Active une landing pour faire apparaître la page publique sur <code>/conferencier/profil/&#123;slug&#125;</code>.
      </p>

      <Accordion type="multiple" className="space-y-2">
        {profiles.map(p => {
          const q = (search[p.id] || "").trim().toLowerCase();
          const searchResults = q.length >= 2
            ? allSpeakers
                .filter(s => s.profile_id !== p.id && !p.extra_speaker_ids.includes(s.id))
                .filter(s => s.name.toLowerCase().includes(q) || (s.role || "").toLowerCase().includes(q))
                .slice(0, 8)
            : [];

          return (
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
                <a
                  href={p.landing_enabled ? `/conferencier/profil/${p.slug}` : `/conferencier/profil/${p.slug}?preview=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                  title={p.landing_enabled ? "Voir la landing en ligne" : "Aperçu (non publiée)"}
                >
                  {p.landing_enabled ? <ExternalLink className="h-4 w-4" /> : <><Eye className="h-4 w-4" /> Aperçu</>}
                </a>
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
                  <Label className="text-xs">Sous-titre (sous le H1)</Label>
                  <Textarea rows={2} value={p.subtitle || ""} onChange={e => updateLocal(p.id, { subtitle: e.target.value })} />
                </div>

                <div>
                  <Label className="text-xs">SEO title (balise &lt;title&gt;)</Label>
                  <Input value={p.seo_title || ""} onChange={e => updateLocal(p.id, { seo_title: e.target.value })} />
                </div>

                <div>
                  <Label className="text-xs">Meta description</Label>
                  <Textarea rows={2} value={p.meta_description || ""} onChange={e => updateLocal(p.id, { meta_description: e.target.value })} />
                </div>

                <div>
                  <Label className="text-xs">Intro complémentaire (HTML, optionnel)</Label>
                  <Textarea rows={3} value={p.intro_html || ""} onChange={e => updateLocal(p.id, { intro_html: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <div>
                    <Label className="text-xs">Texte du bloc CTA (sous le listing)</Label>
                    <Textarea rows={3} value={p.cta_text || ""} onChange={e => updateLocal(p.id, { cta_text: e.target.value })} />
                  </div>
                  <div className="md:w-48">
                    <Label className="text-xs">Libellé du bouton</Label>
                    <Input value={p.cta_button_label || ""} onChange={e => updateLocal(p.id, { cta_button_label: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Profils liés (leurs conférenciers seront fusionnés dans le listing)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 p-2 border rounded bg-muted/20 max-h-48 overflow-auto">
                    {profiles.filter(o => o.id !== p.id).map(o => (
                      <label key={o.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={p.linked_profile_ids.includes(o.id)}
                          onCheckedChange={(v) => toggleLinked(p, o.id, !!v)}
                        />
                        <span>{o.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Astuce : pour grouper deux profils dans les deux sens (ex. GIGN ↔ Militaires), liez-les depuis chaque profil.</p>
                </div>

                <div>
                  <Label className="text-xs">Conférenciers additionnels (ajoutés manuellement, hors profil)</Label>
                  <div className="flex flex-wrap gap-2 my-2">
                    {p.extra_speaker_ids.map(id => {
                      const s = speakerById.get(id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                          {s ? s.name : id}
                          <button type="button" onClick={() => removeExtra(p, id)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                    {p.extra_speaker_ids.length === 0 && (
                      <span className="text-xs text-muted-foreground">Aucun ajout pour l'instant.</span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      value={search[p.id] || ""}
                      onChange={e => setSearch(s => ({ ...s, [p.id]: e.target.value }))}
                      placeholder="Rechercher un conférencier à ajouter…"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-popover border rounded shadow-md max-h-60 overflow-auto">
                        {searchResults.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => addExtra(p, s.id)}
                          >
                            <span className="font-medium">{s.name}</span>
                            {s.role && <span className="text-muted-foreground"> — {s.role}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">FAQ</Label>
                    <Button
                      type="button" size="sm" variant="outline"
                      onClick={() => updateLocal(p.id, { faq: [...p.faq, { question: "", answer: "" }] })}
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
                              updateLocal(p.id, { faq: next });
                            }}
                            aria-label="Question"
                          />
                          <Button type="button" size="icon" variant="ghost" disabled={idx === 0}
                            onClick={() => {
                              const next = [...p.faq];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              updateLocal(p.id, { faq: next });
                            }}><ChevronUp className="h-4 w-4" /></Button>
                          <Button type="button" size="icon" variant="ghost" disabled={idx === p.faq.length - 1}
                            onClick={() => {
                              const next = [...p.faq];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              updateLocal(p.id, { faq: next });
                            }}><ChevronDown className="h-4 w-4" /></Button>
                          <Button type="button" size="icon" variant="ghost"
                            onClick={() => updateLocal(p.id, { faq: p.faq.filter((_, i) => i !== idx) })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          rows={2}
                          value={item.answer}
                          onChange={e => {
                            const next = [...p.faq]; next[idx] = { ...next[idx], answer: e.target.value };
                            updateLocal(p.id, { faq: next });
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
          );
        })}
      </Accordion>
    </div>
  );
};

export default AdminLandingPages;
