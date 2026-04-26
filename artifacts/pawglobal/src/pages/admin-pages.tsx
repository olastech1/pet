import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, FileText, Package, Save, Plus, Trash2,
  RefreshCw, ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { PAGE_DEFAULTS, parseSections, type PageKey, type PageSection } from "@/lib/page-defaults";

const API = "/api";

const PAGES: { key: PageKey; label: string; icon: typeof Shield; updated: string }[] = [
  { key: "page_privacy", label: "Privacy Policy", icon: Shield, updated: "April 10, 2026" },
  { key: "page_terms", label: "Terms of Service", icon: FileText, updated: "April 10, 2026" },
  { key: "page_shipping", label: "Shipping Info", icon: Package, updated: "April 10, 2026" },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

async function loadAllPageContent(): Promise<Record<PageKey, PageSection[]>> {
  const res = await fetch(`${API}/settings`);
  if (!res.ok) throw new Error("Failed to load settings");
  const data = await res.json();
  const result: Record<PageKey, PageSection[]> = {
    page_privacy: PAGE_DEFAULTS.page_privacy,
    page_terms: PAGE_DEFAULTS.page_terms,
    page_shipping: PAGE_DEFAULTS.page_shipping,
  };
  for (const key of ["page_privacy", "page_terms", "page_shipping"] as PageKey[]) {
    const raw = data[key];
    if (raw && typeof raw === "string") {
      const parsed = parseSections(raw);
      if (parsed.length > 0) result[key] = parsed;
    }
  }
  return result;
}

async function savePageContent(key: PageKey, sections: PageSection[]): Promise<void> {
  const res = await fetch(`${API}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [key]: JSON.stringify(sections) }),
  });
  if (!res.ok) throw new Error("Failed to save");
}

export default function AdminPages() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PageKey>("page_privacy");
  const [pages, setPages] = useState<Record<PageKey, PageSection[]>>({
    page_privacy: PAGE_DEFAULTS.page_privacy,
    page_terms: PAGE_DEFAULTS.page_terms,
    page_shipping: PAGE_DEFAULTS.page_shipping,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadAllPageContent();
      setPages(data);
    } catch {
      toast({ title: "Could not load page content", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const sections = pages[activeTab];

  const updateSection = (id: string, field: "title" | "body", value: string) => {
    setPages((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const addSection = () => {
    const newSection: PageSection = { id: uid(), title: "New Section", body: "" };
    setPages((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newSection],
    }));
  };

  const deleteSection = (id: string) => {
    setPages((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((s) => s.id !== id),
    }));
  };

  const moveSection = (id: string, dir: "up" | "down") => {
    setPages((prev) => {
      const arr = [...prev[activeTab]];
      const idx = arr.findIndex((s) => s.id === id);
      if (dir === "up" && idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      if (dir === "down" && idx < arr.length - 1) [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return { ...prev, [activeTab]: arr };
    });
  };

  const resetToDefault = () => {
    if (!confirm("Reset this page to its default content? Any edits will be lost.")) return;
    setPages((prev) => ({ ...prev, [activeTab]: PAGE_DEFAULTS[activeTab] }));
    toast({ title: "Page reset to defaults" });
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePageContent(activeTab, pages[activeTab]);
      toast({ title: "Page saved!", description: "Changes are now live on the site." });
    } catch {
      toast({ title: "Save failed", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const activePageMeta = PAGES.find((p) => p.key === activeTab)!;
  const publicPath = {
    page_privacy: "/privacy-policy",
    page_terms: "/terms-of-service",
    page_shipping: "/shipping-info",
  }[activeTab];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Page Content</h1>
            <p className="text-muted-foreground mt-1">
              Edit the content of your legal and info pages. Changes go live instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview live page
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {PAGES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading page content…
          </div>
        ) : (
          <div className="max-w-3xl space-y-4">
            {/* Sections */}
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className="bg-background border border-border rounded-xl overflow-hidden"
              >
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                    {idx + 1}
                  </span>
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, "title", e.target.value)}
                    className="flex-1 h-8 text-sm font-semibold bg-transparent border-0 shadow-none focus-visible:ring-0 px-1"
                    placeholder="Section title"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveSection(section.id, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(section.id, "down")}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewId(previewId === section.id ? null : section.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Preview section"
                    >
                      {previewId === section.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                {previewId === section.id ? (
                  <div className="p-5 prose prose-sm dark:prose-invert max-w-none min-h-[80px]">
                    {section.body.split("\n").map((line, i) => (
                      <p key={i} className={`text-sm text-muted-foreground ${line.startsWith("- ") ? "ml-4" : ""}`}>
                        {line.startsWith("- ") ? `• ${line.slice(2)}` : line || <br />}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <Textarea
                      value={section.body}
                      onChange={(e) => updateSection(section.id, "body", e.target.value)}
                      className="min-h-[120px] font-mono text-sm bg-muted/20 border-muted resize-y"
                      placeholder={"Write section content here...\n\nUse '- item' for bullet points.\nUse **bold** for bold text."}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Tip: Start a line with <code className="bg-muted px-1 rounded">- </code> to create a bullet point. Use <code className="bg-muted px-1 rounded">**text**</code> for <strong>bold</strong>.
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button onClick={addSection} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Add Section
              </Button>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : `Save ${activePageMeta.label}`}
              </Button>
              <button
                onClick={resetToDefault}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors ml-auto"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
