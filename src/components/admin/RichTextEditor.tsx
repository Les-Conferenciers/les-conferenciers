import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, RemoveFormatting, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      active
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange, placeholder, minHeight = "200px" }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  useEffect(() => {
    if (editorRef.current && value && !value.includes("<")) {
      const html = value
        .split("\n")
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join("");
      editorRef.current.innerHTML = html;
      isInternalUpdate.current = true;
      onChange(html);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          execCommand("bold");
          break;
        case "i":
          e.preventDefault();
          execCommand("italic");
          break;
        case "u":
          e.preventDefault();
          execCommand("underline");
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            execCommand("redo");
          } else {
            execCommand("undo");
          }
          break;
      }
    }
  }, [execCommand]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    const temp = document.createElement("div");
    temp.innerHTML = text;
    temp.querySelectorAll("script, style, meta, link").forEach((el) => el.remove());
    document.execCommand("insertHTML", false, temp.innerHTML);
    handleInput();
  }, [handleInput]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    const toastId = toast.loading("Upload de l'image en cours...");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `editor-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("speaker-photos")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("speaker-photos")
        .getPublicUrl(fileName);

      const imgTag = `<img src="${urlData.publicUrl}" alt="Image" class="rounded-lg max-w-full my-4" />`;
      
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertHTML", false, imgTag);
        handleInput();
      }

      toast.success("Image ajoutée", { id: toastId });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(`Erreur d'upload: ${err.message}`, { id: toastId });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleInput]);

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 flex-wrap">
        <ToolbarButton onClick={() => execCommand("bold")} title="Gras (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand("italic")} title="Italique (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand("underline")} title="Souligné (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => execCommand("insertUnorderedList")} title="Liste à puces">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand("insertOrderedList")} title="Liste numérotée">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insérer une image">
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => execCommand("removeFormat")} title="Supprimer le formatage">
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand("undo")} title="Annuler (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand("redo")} title="Rétablir (Ctrl+Shift+Z)">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="px-4 py-3 outline-none text-sm leading-relaxed prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50 [&:empty]:before:pointer-events-none
          [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-2
          [&_li]:mb-1
          [&_p]:mb-2
          [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-4
          [&_strong]:font-semibold [&_strong]:text-foreground
          focus:ring-0"
        style={{ minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;
