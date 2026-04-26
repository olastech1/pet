import { PageTransition } from "@/components/PageTransition";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ShopDogs() {
  const { dogs } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, sale, adopt
  
  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = dog.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          dog.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || dog.status === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <PageTransition>
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Dogs & Puppies</h1>
            <p className="text-lg text-muted-foreground">Find your perfect companion. From purebred puppies to loving rescues looking for a second chance.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Search by name or breed..." 
                className="pl-10 h-12 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-dogs"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px] h-12 bg-background" data-testid="select-filter-type">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dogs</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="adopt">For Adoption</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {filteredDogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDogs.map((dog, index) => (
                <ProductCard key={dog.id} product={dog} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background rounded-2xl border border-border/50">
              <h3 className="text-xl font-bold mb-2">No dogs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
