import { useRef, useCallback, useEffect, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, RemoveFormatting, ImagePlus, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragImageRef = useRef<HTMLImageElement | null>(null);
  const dragPlaceholderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
        setupImageHandlers();
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      // Clean up any selection artifacts before saving
      const clone = editorRef.current.cloneNode(true) as HTMLDivElement;
      // Remove resize wrappers from saved HTML
      clone.querySelectorAll(".img-resize-wrapper").forEach(wrapper => {
        const img = wrapper.querySelector("img");
        if (img) {
          wrapper.parentNode?.insertBefore(img, wrapper);
        }
        wrapper.remove();
      });
      // Remove selection classes from images
      clone.querySelectorAll("img").forEach(img => {
        img.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        img.style.outline = "";
        img.style.outlineOffset = "";
      });
      onChange(clone.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const setupImageHandlers = useCallback(() => {
    if (!editorRef.current) return;
    const images = editorRef.current.querySelectorAll("img");
    images.forEach((img) => {
      img.style.cursor = "pointer";
      img.draggable = true;
      // Ensure images have explicit width for resizing
      if (!img.style.width && img.naturalWidth) {
        img.style.width = "100%";
        img.style.maxWidth = "100%";
      }
    });
  }, []);

  const selectImage = useCallback((img: HTMLImageElement) => {
    // Deselect previous
    if (selectedImage && selectedImage !== img) {
      selectedImage.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      const oldWrapper = selectedImage.closest(".img-resize-wrapper");
      if (oldWrapper) {
        const parent = oldWrapper.parentNode;
        if (parent) {
          parent.insertBefore(selectedImage, oldWrapper);
          oldWrapper.remove();
        }
      }
    }

    img.classList.add("ring-2", "ring-primary", "ring-offset-2");
    setSelectedImage(img);

    // Wrap in resize container if not already
    if (!img.closest(".img-resize-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "img-resize-wrapper";
      wrapper.contentEditable = "false";
      wrapper.style.cssText = `
        position: relative;
        display: inline-block;
        max-width: 100%;
        user-select: none;
      `;

      // Add resize handles
      const positions = ["se", "sw", "ne", "nw"];
      positions.forEach((pos) => {
        const handle = document.createElement("div");
        handle.className = `resize-handle resize-handle-${pos}`;
        handle.dataset.handle = pos;
        const posStyles: Record<string, string> = {
          se: "bottom: -4px; right: -4px; cursor: nwse-resize;",
          sw: "bottom: -4px; left: -4px; cursor: nesw-resize;",
          ne: "top: -4px; right: -4px; cursor: nesw-resize;",
          nw: "top: -4px; left: -4px; cursor: nwse-resize;",
        };
        handle.style.cssText = `
          position: absolute;
          width: 10px;
          height: 10px;
          background: hsl(var(--primary));
          border: 2px solid white;
          border-radius: 2px;
          z-index: 10;
          ${posStyles[pos]}
        `;
        wrapper.appendChild(handle);
      });

      // Add size label
      const sizeLabel = document.createElement("div");
      sizeLabel.className = "img-size-label";
      sizeLabel.style.cssText = `
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background: hsl(var(--primary));
        color: white;
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 3px;
        white-space: nowrap;
        z-index: 10;
      `;
      sizeLabel.textContent = `${Math.round(img.getBoundingClientRect().width)}px`;
      wrapper.appendChild(sizeLabel);

      img.parentNode?.insertBefore(wrapper, img);
      wrapper.insertBefore(img, wrapper.firstChild);
    }
  }, [selectedImage]);

  const deselectImage = useCallback(() => {
    if (selectedImage) {
      selectedImage.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      const wrapper = selectedImage.closest(".img-resize-wrapper");
      if (wrapper) {
        const parent = wrapper.parentNode;
        if (parent) {
          parent.insertBefore(selectedImage, wrapper);
          wrapper.remove();
        }
      }
      setSelectedImage(null);
    }
  }, [selectedImage]);

  // Handle click on editor to select/deselect images
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === "IMG") {
      e.preventDefault();
      selectImage(target as HTMLImageElement);
    } else if (!target.closest(".img-resize-wrapper")) {
      deselectImage();
    }
  }, [selectImage, deselectImage]);

  // Handle resize via mousedown on handles
  const handleEditorMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicking a resize handle
    if (target.classList.contains("resize-handle") && selectedImage) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const handle = target.dataset.handle || "se";
      const startX = e.clientX;
      const startWidth = selectedImage.getBoundingClientRect().width;
      const aspectRatio = selectedImage.naturalWidth / selectedImage.naturalHeight;

      const onMouseMove = (me: MouseEvent) => {
        const isLeft = handle.includes("w");
        const dx = isLeft ? startX - me.clientX : me.clientX - startX;
        const newWidth = Math.max(80, Math.min(startWidth + dx, editorRef.current?.clientWidth || 800));
        selectedImage.style.width = `${newWidth}px`;
        selectedImage.style.maxWidth = "100%";
        selectedImage.style.height = "auto";

        // Update size label
        const wrapper = selectedImage.closest(".img-resize-wrapper");
        const label = wrapper?.querySelector(".img-size-label") as HTMLElement;
        if (label) label.textContent = `${Math.round(newWidth)}px`;
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        handleInput();
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }

    // Start dragging an image
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      const startY = e.clientY;
      const startX = e.clientX;
      let hasMoved = false;

      // Prevent browser default drag behavior
      e.preventDefault();

      const onMouseMove = (me: MouseEvent) => {
        if (Math.abs(me.clientX - startX) < 5 && Math.abs(me.clientY - startY) < 5) return;
        
        if (!hasMoved) {
          hasMoved = true;
          setIsDragging(true);
          dragImageRef.current = img;
          
          // Use outline instead of opacity to avoid greying out
          img.style.outline = "2px dashed hsl(var(--primary))";
          img.style.outlineOffset = "2px";
          
          // Create drop placeholder
          const ph = document.createElement("div");
          ph.style.cssText = "height: 3px; background: hsl(var(--primary)); border-radius: 2px; margin: 4px 0;";
          dragPlaceholderRef.current = ph;
        }

        // Position placeholder at cursor
        if (editorRef.current && dragPlaceholderRef.current) {
          dragPlaceholderRef.current.remove();
          
          const range = document.caretRangeFromPoint(me.clientX, me.clientY);
          if (range) {
            const container = range.startContainer;
            const node = container.nodeType === 3 ? container.parentNode : container;
            if (node && editorRef.current.contains(node)) {
              // Find the block-level parent
              let block: Node | null = node as Node;
              while (block && block !== editorRef.current && block.parentNode !== editorRef.current) {
                block = block.parentNode;
              }
              if (block && block !== editorRef.current) {
                const rect = (block as HTMLElement).getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (me.clientY < midY) {
                  block.parentNode?.insertBefore(dragPlaceholderRef.current, block);
                } else {
                  block.parentNode?.insertBefore(dragPlaceholderRef.current, block.nextSibling);
                }
              }
            }
          }
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        
        if (hasMoved && dragImageRef.current && dragPlaceholderRef.current && editorRef.current) {
          const imgEl = dragImageRef.current;
          
          // First, deselect to remove any wrapper
          deselectImage();
          
          // Remove image from current position
          const oldParent = imgEl.parentNode;
          if (oldParent) {
            oldParent.removeChild(imgEl);
            // Clean up empty parent paragraph if needed
            if (oldParent !== editorRef.current && oldParent.childNodes.length === 0) {
              oldParent.parentNode?.removeChild(oldParent);
            }
          }
          
          // Insert at placeholder position
          dragPlaceholderRef.current.parentNode?.insertBefore(imgEl, dragPlaceholderRef.current);
          dragPlaceholderRef.current.remove();
          
          // Reset styles
          imgEl.style.outline = "";
          imgEl.style.outlineOffset = "";
          
          handleInput();
        } else if (dragImageRef.current) {
          dragImageRef.current.style.outline = "";
          dragImageRef.current.style.outlineOffset = "";
        }
        
        setIsDragging(false);
        dragImageRef.current = null;
        dragPlaceholderRef.current = null;
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  }, [selectedImage, handleInput]);

  // Alignment for selected image - with text wrapping
  const alignImage = useCallback((align: "left" | "center" | "right") => {
    if (!selectedImage) return;
    
    // Reset all alignment styles
    selectedImage.style.float = "none";
    selectedImage.style.marginLeft = "";
    selectedImage.style.marginRight = "";
    selectedImage.style.marginBottom = "";
    selectedImage.style.display = "";

    // Also reset parent container textAlign
    const container = (selectedImage.closest(".img-resize-wrapper") || selectedImage).parentNode as HTMLElement;
    if (container && container !== editorRef.current) {
      container.style.textAlign = "";
    }

    if (align === "left") {
      selectedImage.style.float = "left";
      selectedImage.style.marginRight = "16px";
      selectedImage.style.marginBottom = "8px";
    } else if (align === "right") {
      selectedImage.style.float = "right";
      selectedImage.style.marginLeft = "16px";
      selectedImage.style.marginBottom = "8px";
    } else {
      selectedImage.style.float = "none";
      selectedImage.style.display = "block";
      selectedImage.style.marginLeft = "auto";
      selectedImage.style.marginRight = "auto";
      selectedImage.style.marginBottom = "8px";
    }
    handleInput();
  }, [selectedImage, handleInput]);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        deselectImage();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [deselectImage]);

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
    // Delete selected image on Delete/Backspace
    if (selectedImage && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      const wrapper = selectedImage.closest(".img-resize-wrapper");
      if (wrapper) wrapper.remove();
      else selectedImage.remove();
      setSelectedImage(null);
      handleInput();
      return;
    }

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
  }, [execCommand, selectedImage, handleInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    const temp = document.createElement("div");
    temp.innerHTML = text;
    temp.querySelectorAll("script, style, meta, link").forEach((el) => el.remove());
    document.execCommand("insertHTML", false, temp.innerHTML);
    handleInput();
    setTimeout(setupImageHandlers, 100);
  }, [handleInput, setupImageHandlers]);

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

      const imgTag = `<figure style="text-align:center;margin:16px 0"><img src="${urlData.publicUrl}" alt="Image" style="max-width:100%;width:100%;border-radius:8px;cursor:pointer;" /></figure>`;
      
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertHTML", false, imgTag);
        handleInput();
        setTimeout(setupImageHandlers, 100);
      }

      toast.success("Image ajoutée", { id: toastId });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(`Erreur d'upload: ${err.message}`, { id: toastId });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleInput, setupImageHandlers]);

  // Setup image handlers on mount
  useEffect(() => {
    setTimeout(setupImageHandlers, 200);
  }, [setupImageHandlers]);

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

        {selectedImage && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarButton onClick={() => alignImage("left")} title="Image à gauche">
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => alignImage("center")} title="Image centrée">
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => alignImage("right")} title="Image à droite">
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}

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
        onClick={handleEditorClick}
        onMouseDown={handleEditorMouseDown}
        data-placeholder={placeholder}
        className={`px-4 py-3 outline-none text-sm leading-relaxed prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50 [&:empty]:before:pointer-events-none
          [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-2
          [&_li]:mb-1
          [&_p]:mb-2
          [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-4 [&_img]:cursor-pointer
          [&_strong]:font-semibold [&_strong]:text-foreground
          focus:ring-0
          ${isDragging ? "cursor-grabbing" : ""}
        `}
        style={{ minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;
