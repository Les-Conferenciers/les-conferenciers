import { useState, KeyboardEvent, ClipboardEvent } from "react";
import { X } from "lucide-react";

export const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

export const splitEmails = (v: string) =>
  v.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);

interface Props {
  value: string; // comma-separated
  onChange: (v: string) => void;
}

export function EmailChipsInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const emails = splitEmails(value);

  const commit = (raw: string) => {
    const add = splitEmails(raw);
    if (!add.length) return;
    const next = [...emails];
    add.forEach((e) => { if (!next.some((x) => x.toLowerCase() === e.toLowerCase())) next.push(e); });
    onChange(next.join(", "));
    setDraft("");
  };
  const remove = (i: number) => onChange(emails.filter((_, j) => j !== i).join(", "));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";", " ", "Tab"].includes(e.key) && draft.trim()) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && emails.length) {
      remove(emails.length - 1);
    }
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    commit(e.clipboardData.getData("text"));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring">
      {emails.map((em, i) => {
        const ok = EMAIL_RE.test(em);
        return (
          <span
            key={em + i}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs max-w-full break-all ${
              ok ? "bg-secondary text-secondary-foreground" : "bg-destructive/15 text-destructive border border-destructive/40"
            }`}
            title={ok ? em : "Adresse invalide"}
          >
            {em}
            <button type="button" onClick={() => remove(i)} aria-label={`Retirer ${em}`} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
      <input
        className="flex-1 min-w-[10rem] bg-transparent outline-none py-0.5"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
        onBlur={() => draft.trim() && commit(draft)}
      />
    </div>
  );
}
