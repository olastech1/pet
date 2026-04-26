import { useEffect } from "react";

const SITE_NAME = "EuthList";
const SITE_URL = "https://euthlist.com";
const DEFAULT_TITLE = "EuthList — Urgent Pet Rescue List | euthlist.com";
const DEFAULT_DESC = "EuthList helps rescue pets from euthanasia. Adopt a dog or cat, shop pet supplies, and donate to animal rescue operations worldwide.";
const DEFAULT_KEYWORDS = "pet rescue, adopt a dog, adopt a cat, animal rescue, euthanasia list, rescue dogs, rescue cats, pet supplies, donate to animal rescue, urgent pet rescue";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80";

interface SEOSettings {
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoKeywords: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImage: string;
  seoCanonicalUrl: string;
  seoTwitterCard: string;
  storeName: string;
}

let _cache: SEOSettings | null = null;
let _promise: Promise<SEOSettings> | null = null;

export function invalidateSEOCache() {
  _cache = null;
  _promise = null;
}

async function fetchSEO(): Promise<SEOSettings> {
  if (_cache) return _cache;
  if (!_promise) {
    _promise = fetch("/api/settings", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        _cache = {
          seoMetaTitle: d.seoMetaTitle || "",
          seoMetaDescription: d.seoMetaDescription || "",
          seoKeywords: d.seoKeywords || "",
          seoOgTitle: d.seoOgTitle || "",
          seoOgDescription: d.seoOgDescription || "",
          seoOgImage: d.seoOgImage || "",
          seoCanonicalUrl: d.seoCanonicalUrl || SITE_URL,
          seoTwitterCard: d.seoTwitterCard || "summary_large_image",
          storeName: d.storeName || SITE_NAME,
        };
        return _cache!;
      })
      .catch(() => { _promise = null; return empty(); });
  }
  return _promise;
}

function empty(): SEOSettings {
  return { seoMetaTitle: "", seoMetaDescription: "", seoKeywords: "", seoOgTitle: "", seoOgDescription: "", seoOgImage: "", seoCanonicalUrl: SITE_URL, seoTwitterCard: "summary_large_image", storeName: SITE_NAME };
}

function setMeta(attr: string, val: string, attrName = "name") {
  let el = document.querySelector(`meta[${attrName}="${attr}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attr);
    document.head.appendChild(el);
  }
  el.setAttribute("content", val);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: "website" | "article" | "product";
}

export default function SEOHead({ title, description, keywords, image, type = "website" }: SEOHeadProps) {
  useEffect(() => {
    fetchSEO().then(s => {
      const siteName = s.storeName || SITE_NAME;
      const resolvedTitle = title
        ? `${title} | ${siteName}`
        : s.seoMetaTitle || DEFAULT_TITLE;
      const resolvedDesc = description || s.seoMetaDescription || DEFAULT_DESC;
      const resolvedKeywords = keywords
        ? (s.seoKeywords ? `${keywords}, ${s.seoKeywords}` : keywords)
        : s.seoKeywords || DEFAULT_KEYWORDS;
      const resolvedImage = image || s.seoOgImage || DEFAULT_IMAGE;
      const ogTitle = s.seoOgTitle || resolvedTitle;
      const ogDesc = s.seoOgDescription || resolvedDesc;
      const canonical = s.seoCanonicalUrl || SITE_URL;
      const twitterCard = s.seoTwitterCard || "summary_large_image";
      const pageUrl = `${canonical}${window.location.pathname}`.replace(/\/$/, "") || canonical;

      document.title = resolvedTitle;

      setMeta("description", resolvedDesc);
      setMeta("keywords", resolvedKeywords);
      setMeta("robots", "index, follow");

      setMeta("og:title", ogTitle, "property");
      setMeta("og:description", ogDesc, "property");
      setMeta("og:image", resolvedImage, "property");
      setMeta("og:type", type, "property");
      setMeta("og:site_name", siteName, "property");
      setMeta("og:url", pageUrl, "property");

      setMeta("twitter:card", twitterCard);
      setMeta("twitter:title", ogTitle);
      setMeta("twitter:description", ogDesc);
      setMeta("twitter:image", resolvedImage);

      setLink("canonical", pageUrl);
    });
  }, [title, description, keywords, image, type]);

  return null;
}
