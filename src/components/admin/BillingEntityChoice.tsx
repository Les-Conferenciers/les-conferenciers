import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type BillingEntity = {
  name: string;
  address: string;
  siret: string;
  vat: string;
  email: string;
  phone: string;
};
export type BillingMode = "client" | "entity";

type Props = {
  mode: BillingMode;
  onModeChange: (m: BillingMode) => void;
  value: BillingEntity;
  onChange: (v: BillingEntity) => void;
  clientName: string;
  idPrefix: string;
};

export function BillingEntityChoice({ mode, onModeChange, value, onChange, clientName, idPrefix }: Props) {
  const set = (k: keyof BillingEntity) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <Label className="text-xs font-medium">Facturer à</Label>
      <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as BillingMode)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label htmlFor={`${idPrefix}-client`} className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer text-sm min-w-0">
          <RadioGroupItem id={`${idPrefix}-client`} value="client" />
          <span className="truncate">Facturer le client ({clientName})</span>
        </label>
        <label htmlFor={`${idPrefix}-entity`} className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer text-sm">
          <RadioGroupItem id={`${idPrefix}-entity`} value="entity" />
          <span>Créer une entité à facturer</span>
        </label>
      </RadioGroup>
      {mode === "entity" && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Nom de l'entité *</Label>
            <Input value={value.name} onChange={set("name")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">SIRET</Label>
              <Input value={value.siret} onChange={set("siret")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">N° TVA intra (optionnel)</Label>
              <Input value={value.vat} onChange={set("vat")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Adresse mail</Label>
              <Input type="email" value={value.email} onChange={set("email")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Téléphone</Label>
              <Input type="tel" value={value.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Adresse postale</Label>
            <Textarea rows={2} value={value.address} onChange={set("address")} className="text-sm" />
          </div>
          <p className="text-[10px] text-muted-foreground">La facture sera adressée à cette entité, avec la mention « Pour le compte de {clientName} ».</p>
        </div>
      )}
    </div>
  );
}

export function billingPayload(mode: BillingMode, b: BillingEntity) {
  const e = mode === "entity";
  const v = (s: string) => (e ? s.trim() || null : null);
  return {
    billing_entity_name: v(b.name),
    billing_entity_address: v(b.address),
    billing_entity_siret: v(b.siret),
    billing_entity_vat: v(b.vat),
    billing_entity_email: v(b.email),
    billing_entity_phone: v(b.phone),
  };
}
