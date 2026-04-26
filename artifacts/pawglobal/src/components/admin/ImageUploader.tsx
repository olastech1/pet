import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ImageUrlInputProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  single?: boolean;
}

export function ImageUploader({ value, onChange, single = false }: ImageUrlInputProps) {
  if (single) {
    return (
      <div className="space-y-1">
        <Input
          type="url"
          value={value[0] ?? ""}
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
          placeholder="https://drive.google.com/uc?export=view&id=..."
        />
        <p className="text-xs text-muted-foreground">Paste a direct image URL (Google Drive, Imgur, etc.)</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Textarea
        rows={3}
        value={value.join("\n")}
        onChange={(e) => {
          const urls = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
          onChange(urls);
        }}
        placeholder={"https://drive.google.com/uc?export=view&id=...\nhttps://i.imgur.com/..."}
      />
      <p className="text-xs text-muted-foreground">One URL per line. Paste direct image links (Google Drive, Imgur, etc.)</p>
    </div>
  );
}
