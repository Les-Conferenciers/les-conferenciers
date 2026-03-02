import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      e.preventDefault(); // Prevent losing focus/selection
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

  // Sync value -> editor only on mount or external changes
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

  // Convert plain text with \n to HTML on first load
  useEffect(() => {
    if (editorRef.current && value && !value.includes("<")) {
      // Plain text: convert newlines to <p> tags
      const html = value
        .split("\n")
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join("");
      editorRef.current.innerHTML = html;
      isInternalUpdate.current = true;
      onChange(html);
    }
  }, []); // Only on mount

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+B, Ctrl+I, Ctrl+U shortcuts
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

  // Convert HTML back to clean text for storage
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    // Clean the pasted HTML — keep only safe tags
    const temp = document.createElement("div");
    temp.innerHTML = text;
    // Remove scripts, styles, etc.
    temp.querySelectorAll("script, style, meta, link").forEach((el) => el.remove());
    document.execCommand("insertHTML", false, temp.innerHTML);
    handleInput();
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
          [&_strong]:font-semibold [&_strong]:text-foreground
          focus:ring-0"
        style={{ minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;
