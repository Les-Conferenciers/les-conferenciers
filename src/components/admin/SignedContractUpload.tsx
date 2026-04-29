import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Download, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

type SignedFile = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
};

type Props = {
  contractId: string;
};

const ALLOWED = [
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
};

const SignedContractUpload = ({ contractId }: Props) => {
  const [files, setFiles] = useState<SignedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("signed_contract_files" as any)
      .select("*")
      .eq("contract_id", contractId)
      .order("uploaded_at", { ascending: false });
    setFiles((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [contractId]);

  const handleUpload = async (file: File) => {
    if (!ALLOWED.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic|doc|docx)$/i)) {
      toast.error("Format non supporté (PDF, image ou Word uniquement)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 20 Mo)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${contractId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("signed-contracts")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase
        .from("signed_contract_files" as any)
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || null,
        } as any);
      if (insErr) throw insErr;

      toast.success("Contrat signé téléversé");
      fetchFiles();
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur de téléversement");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = async (file: SignedFile) => {
    const { data, error } = await supabase.storage
      .from("signed-contracts")
      .createSignedUrl(file.file_path, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error("Impossible de télécharger");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (file: SignedFile) => {
    if (!confirm(`Supprimer "${file.file_name}" ?`)) return;
    await supabase.storage.from("signed-contracts").remove([file.file_path]);
    await supabase.from("signed_contract_files" as any).delete().eq("id", file.id);
    toast.success("Fichier supprimé");
    fetchFiles();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Contrats signés reçus
        </h4>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Téléversement…" : "Téléverser"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
      </div>

      {loading ? (
        <p className="text-[11px] text-muted-foreground">Chargement…</p>
      ) : files.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">Aucun contrat signé déposé pour le moment. Formats acceptés : PDF, image, Word.</p>
      ) : (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/60 text-xs">
              <button
                onClick={() => handleDownload(f)}
                className="flex-1 flex items-center gap-2 text-left hover:text-primary truncate"
                title="Télécharger"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate font-medium">{f.file_name}</span>
                <span className="text-muted-foreground text-[10px] shrink-0">
                  {formatSize(f.file_size)} · {new Date(f.uploaded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                </span>
              </button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDownload(f)} title="Télécharger">
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(f)} title="Supprimer">
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SignedContractUpload;
