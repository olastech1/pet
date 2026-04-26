import { PageTransition } from "@/components/PageTransition";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ShopSupplies() {
  const { supplies } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all"); 
  
  const categories = Array.from(new Set(supplies.map(s => s.category).filter(Boolean)));

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || supply.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageTransition>
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Premium Pet Supplies</h1>
            <p className="text-lg text-muted-foreground">Everything your pet needs to thrive, with worldwide delivery to your door.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Search supplies..." 
                className="pl-10 h-12 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-supplies"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 bg-background" data-testid="select-filter-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {filteredSupplies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSupplies.map((supply, index) => (
                <ProductCard key={supply.id} product={supply} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background rounded-2xl border border-border/50">
              <h3 className="text-xl font-bold mb-2">No supplies found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
