import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ProductForm } from "@/components/admin/ProductForm";
import { Product } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { SafeImg } from "@/components/ui/safe-img";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSupplies() {
  const { supplies, addProduct, updateProduct, deleteProduct } = useAdminData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = supplies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleSubmit = (data: Omit<Product, "id">) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, { ...data, type: "supply" });
      toast({ title: "Supply updated successfully" });
    } else {
      addProduct({ ...data, type: "supply" });
      toast({ title: "Supply added successfully" });
    }
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string, name: string) => {
    deleteProduct(id);
    toast({ title: `${name} removed` });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pet Supplies</h1>
            <p className="text-muted-foreground mt-1">{supplies.length} product{supplies.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={handleAdd} className="gap-2" data-testid="button-add-supply">
            <PlusCircle className="w-4 h-4" /> Add Supply
          </Button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-supplies"
          />
        </div>

        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price (USD)</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Price (EUR)</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No supplies found. Add your first product.
                  </td>
                </tr>
              )}
              {filtered.map(supply => (
                <tr key={supply.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-supply-${supply.id}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <SafeImg
                        src={supply.images[0]}
                        alt={supply.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <p className="font-medium text-foreground">{supply.name}</p>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {supply.category ? (
                      <Badge variant="outline">{supply.category}</Badge>
                    ) : "—"}
                  </td>
                  <td className="p-4 font-medium text-foreground">${supply.priceUSD.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">€{Math.round(supply.priceUSD * 0.92)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(supply)} className="h-8 w-8 p-0" data-testid={`button-edit-supply-${supply.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`button-delete-supply-${supply.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove "{supply.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this product from the store.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(supply.id, supply.name)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Supply" : "Add New Supply"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            defaultValues={editingProduct ? { ...editingProduct } : { type: "supply" }}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
