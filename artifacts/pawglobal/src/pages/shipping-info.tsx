import { PageTransition } from "@/components/PageTransition";
import { PageRenderer } from "@/components/PageRenderer";
import { usePageContent } from "@/hooks/use-page-content";
import { Package } from "lucide-react";

export default function ShippingInfo() {
  const { sections, loading } = usePageContent("page_shipping");

  return (
    <PageTransition>
      <div className="bg-background min-h-screen py-12 lg:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Shipping</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Shipping Information</h1>
            <p className="text-muted-foreground">Last updated: April 10, 2026 · We ship worldwide to 40+ countries</p>
          </div>
          {loading ? (
            <div className="space-y-8 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : (
            <PageRenderer sections={sections} />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
