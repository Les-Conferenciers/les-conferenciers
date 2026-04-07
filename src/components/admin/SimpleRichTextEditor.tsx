import { useRef, useCallback, useEffect, useState } from "react";
import { Bold, Italic, Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const EMOJIS = [
  "😊", "👋", "🎯", "✅", "📞", "📧", "🎤", "🌟", "💡", "🔥",
  "👉", "📅", "🏢", "🤝", "💼", "📋", "✨", "🎉", "👏", "💪",
  "❤️", "🙏", "📌", "⭐", "🎓", "🌍", "📊", "🔑", "💎", "🚀",
];

const ToolbarBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={`p-1.5 rounded transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
  >
    {children}
  </button>
);

const SimpleRichTextEditor = ({ value, onChange, placeholder, rows = 6 }: SimpleRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const execCommand = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  }, [handleInput]);

  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    handleInput();
    setEmojiOpen(false);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    
    if (html) {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      temp.querySelectorAll("script, style, meta, link, font").forEach((el) => el.remove());
      temp.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
      temp.querySelectorAll("[class]").forEach((el) => el.removeAttribute("class"));
      temp.querySelectorAll("span").forEach((el) => {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
      });
      document.execCommand("insertHTML", false, temp.innerHTML);
    } else {
      document.execCommand("insertText", false, plain);
    }
    handleInput();
  }, [handleInput]);

  const minHeight = `${Math.max(rows * 24, 100)}px`;

  return (
    <div className="border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-input bg-muted/30">
        <ToolbarBtn onClick={() => execCommand("bold")} title="Gras"><Bold className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => execCommand("italic")} title="Italique"><Italic className="h-4 w-4" /></ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Émoji">
              <Smile className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-10 gap-1">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => insertEmoji(e)} className="text-lg hover:bg-muted rounded p-0.5 transition-colors">
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="px-3 py-2 outline-none overflow-y-auto bg-background"
        style={{ minHeight, fontFamily: "Arial, sans-serif", fontSize: "15px", lineHeight: "1.6", color: "#333", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />
    </div>
  );
};

export default SimpleRichTextEditor;
