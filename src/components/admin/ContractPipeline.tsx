import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PipelineStage = {
  key: string;
  label: string;
  shortLabel?: string;
  doneAt: string | null | undefined;
  toggle?: {
    table: "events" | "contracts";
    rowId: string | null;
    field: string;
    valueType?: "date" | "timestamp";
  };
  /** Si défini, le clic déclenche onCustomAction(key, stage) au lieu du toggle direct (ex: ouvrir un picker date/heure) */
  customAction?: string;
};

const formatDate = (d: string | null | undefined) => {
  if (!d) return null;
  const dt = new Date(d.length === 10 ? d + "T12:00:00" : d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

type Props = {
  stages: PipelineStage[];
  onChange?: () => void;
  compact?: boolean;
  onCustomAction?: (key: string, stage: PipelineStage) => void;
};

const ContractPipeline = ({ stages, onChange, compact = false, onCustomAction }: Props) => {
  const handleToggle = async (stage: PipelineStage) => {
    if (stage.customAction && onCustomAction) {
      onCustomAction(stage.customAction, stage);
      return;
    }
    if (!stage.toggle) return;
    const { table, rowId, field, valueType = "timestamp" } = stage.toggle;
    if (!rowId) {
      toast.error("Élément introuvable");
      return;
    }
    const newValue = stage.doneAt
      ? null
      : valueType === "date"
        ? new Date().toISOString().slice(0, 10)
        : new Date().toISOString();
    const { error } = await supabase.from(table).update({ [field]: newValue } as any).eq("id", rowId);
    if (error) {
      toast.error("Erreur de mise à jour");
      return;
    }
    toast.success(stage.doneAt ? "Étape réinitialisée" : "Étape marquée comme faite");
    onChange?.();
  };

  return (
    <div className={cn("flex items-stretch gap-1 overflow-x-auto pb-1", compact && "gap-0.5")}>
      {stages.map((stage, idx) => {
        const done = !!stage.doneAt;
        const isLast = idx === stages.length - 1;
        const nextDone = !isLast && !!stages[idx + 1].doneAt;
        const clickable = !!stage.toggle?.rowId || (!!stage.customAction && !!onCustomAction);
        return (
          <React.Fragment key={stage.key}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleToggle(stage); }}
              disabled={!clickable}
              title={
                stage.customAction
                  ? (done ? `Planifié le ${formatDate(stage.doneAt)} — cliquer pour modifier` : "Cliquer pour planifier")
                  : (stage.toggle?.rowId ? (done ? "Cliquer pour réinitialiser" : "Cliquer pour marquer comme fait") : "Disponible une fois le contrat créé")
              }
              className={cn(
                "group flex flex-col items-center gap-1 px-1.5 py-1 rounded-md transition-colors min-w-[64px]",
                "hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed",
                done && "text-emerald-700",
                !done && "text-muted-foreground",
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full border-2 transition-all",
                compact ? "h-6 w-6" : "h-7 w-7",
                done
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-background border-muted-foreground/30 text-muted-foreground/60 group-hover:border-primary/50",
              )}>
                {done ? <Check className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={3} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
              </div>
              <div className="flex flex-col items-center leading-tight">
                <span className={cn("text-[10px] font-medium text-center max-w-[80px]", done && "text-foreground")}>
                  {stage.shortLabel || stage.label}
                </span>
                {done && (
                  <span className="text-[9px] text-emerald-600 font-medium">{formatDate(stage.doneAt)}</span>
                )}
              </div>
            </button>
            {!isLast && (
              <div className="flex items-center pb-4">
                <div className={cn("h-0.5 w-3 transition-colors", done && nextDone ? "bg-emerald-500" : done ? "bg-emerald-500/40" : "bg-muted-foreground/20")} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ContractPipeline;
