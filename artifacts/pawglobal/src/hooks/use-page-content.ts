import { useState, useEffect } from "react";
import { PAGE_DEFAULTS, parseSections, type PageKey, type PageSection } from "@/lib/page-defaults";

const API = "/api";

export function usePageContent(key: PageKey): { sections: PageSection[]; loading: boolean } {
  const [sections, setSections] = useState<PageSection[]>(PAGE_DEFAULTS[key]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data[key];
        if (raw && typeof raw === "string") {
          const parsed = parseSections(raw);
          if (parsed.length > 0) {
            setSections(parsed);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [key]);

  return { sections, loading };
}
