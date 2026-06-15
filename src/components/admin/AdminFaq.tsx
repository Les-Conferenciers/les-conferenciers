import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type FaqItem = { question: string; answer: string };

const PAGES = [{ key: "conferencier", label: "Page Conférenciers — /conferencier" }];

const cleanText = (s: string) => s.replace(/[\u2018\u2019\u02BC]/g, "'");

const AdminFaq = () => {
  const [pageKey, setPageKey] = useState("conferencier");
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (key: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_faqs")
      .select("items")
      .eq("page_key", key)
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setItems(((data?.items as FaqItem[] | null) ?? []).map((it) => ({
      question: it.question ?? "",
      answer: it.answer ?? "",
    })));
  };

  useEffect(() => {
    load(pageKey);
  }, [pageKey]);

  const update = (idx: number, patch: Partial<FaqItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const add = () => setItems((prev) => [...prev, { question: "", answer: "" }]);

  const save = async () => {
    setSaving(true);
    const cleaned = items
      .map((it) => ({ question: cleanText(it.question).trim(), answer: cleanText(it.answer).trim() }))
      .filter((it) => it.question.length > 0);
    const { error } = await supabase
      .from("page_faqs")
      .upsert({ page_key: pageKey, items: cleaned as any }, { onConflict: "page_key" });
    setSaving(false);
    if (error) {
      toast({ title: "Erreur d'enregistrement", description: error.message, variant: "destructive" });
      return;
    }
    setItems(cleaned);
    toast({ title: "FAQ enregistrée", description: `${cleaned.length} question(s) sauvegardée(s).` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div className="space-y-2">
          <Label>Page</Label>
          <Select value={pageKey} onValueChange={setPageKey}>
            <SelectTrigger className="w-[340px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGES.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter une question
          </Button>
          <Button onClick={save} disabled={saving || loading} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Chargement…</div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <Card key={idx} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Question {idx + 1}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === items.length - 1} onClick={() => move(idx, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Question</Label>
                <Input value={item.question} onChange={(e) => update(idx, { question: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Réponse (séparez les paragraphes par une ligne vide)</Label>
                <Textarea
                  value={item.answer}
                  onChange={(e) => update(idx, { answer: e.target.value })}
                  className="min-h-[240px] font-normal leading-relaxed"
                />
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-muted-foreground text-sm">Aucune question. Cliquez sur « Ajouter une question » pour commencer.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFaq;
