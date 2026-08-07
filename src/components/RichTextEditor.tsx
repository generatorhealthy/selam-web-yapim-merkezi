import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

/**
 * Profesyonel blog içerik editörü: başlık seviyeleri, kalın/italik, renk,
 * hizalama, listeler, link, alıntı, kod ve görsel ekleme desteği.
 */
const RichTextEditor = ({ value, onChange, placeholder, minHeight = 320 }: RichTextEditorProps) => {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
      clipboard: { matchVisual: false },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
  ];

  const plainText = (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-md border bg-background">
      <style>{`
        .rte .ql-toolbar { border: none; border-bottom: 1px solid hsl(var(--border)); border-radius: 0.375rem 0.375rem 0 0; background: hsl(var(--muted) / 0.4); }
        .rte .ql-container { border: none; font-size: 15px; }
        .rte .ql-editor { min-height: ${minHeight}px; line-height: 1.7; }
        .rte .ql-editor.ql-blank::before { color: hsl(var(--muted-foreground)); font-style: normal; }
      `}</style>
      <div className="rte">
        <ReactQuill
          theme="snow"
          value={value || ""}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || "İçeriği buraya yazın..."}
        />
      </div>
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>Metni seçip renk, kalınlık, başlık ve link ekleyebilirsiniz.</span>
        <span>{wordCount} kelime</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
