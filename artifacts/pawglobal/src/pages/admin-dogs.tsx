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

export default function AdminDogs() {
  const { dogs, addProduct, updateProduct, deleteProduct } = useAdminData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string | null>(null);

  const filtered = dogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.breed?.toLowerCase().includes(search.toLowerCase())
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
      updateProduct(editingProduct.id, { ...data, type: "dog" });
      toast({ title: "Dog updated successfully" });
    } else {
      addProduct({ ...data, type: "dog" });
      toast({ title: "Dog added successfully" });
    }
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (deleteConfirmId && deleteConfirmName) {
      deleteProduct(deleteConfirmId);
      toast({ title: `${deleteConfirmName} removed` });
      setDeleteConfirmId(null);
      setDeleteConfirmName(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dogs & Puppies</h1>
            <p className="text-muted-foreground mt-1">{dogs.length} listing{dogs.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={handleAdd} className="gap-2" data-testid="button-add-dog">
            <PlusCircle className="w-4 h-4" /> Add Dog
          </Button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or breed..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-dogs"
          />
        </div>

        <div className="bg-background border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Pet</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Breed</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Location</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No dogs found. Add your first listing.
                  </td>
                </tr>
              )}
              {filtered.map(dog => (
                <tr key={dog.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-dog-${dog.id}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <SafeImg
                        src={dog.images[0]}
                        alt={dog.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div>
                        <p className="font-medium text-foreground">{dog.name}</p>
                        <p className="text-xs text-muted-foreground">{dog.age} · {dog.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{dog.breed ?? "—"}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{dog.location}</td>
                  <td className="p-4 font-medium text-foreground">
                    {dog.status === "adopt" ? "Free" : `$${dog.priceUSD.toLocaleString()}`}
                  </td>
                  <td className="p-4">
                    <Badge variant={dog.status === "adopt" ? "outline" : "default"} className={dog.status === "adopt" ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400" : ""}>
                      {dog.status === "adopt" ? "For Adoption" : "For Sale"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(dog)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-edit-dog-${dog.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-testid={`button-delete-dog-${dog.id}`}
                        onClick={() => {
                          setDeleteConfirmId(dog.id);
                          setDeleteConfirmName(dog.name);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
            <DialogTitle>{editingProduct ? "Edit Dog" : "Add New Dog"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            defaultValues={editingProduct ? { ...editingProduct } : { type: "dog" }}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteConfirmName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteConfirmName} from the store. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
