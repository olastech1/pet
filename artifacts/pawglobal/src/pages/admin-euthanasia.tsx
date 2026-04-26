import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { EuthanasiaListing } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, CheckCircle, AlertTriangle, X, Clock, MapPin, Save } from "lucide-react";

const EMPTY_FORM: Omit<EuthanasiaListing, "id" | "addedAt"> = {
  name: "",
  species: "dog",
  breed: "",
  age: "",
  gender: "unknown",
  shelter: "",
  location: "",
  deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  image: "",
  description: "",
  status: "at-risk",
  author: "",
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function ListingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<EuthanasiaListing, "id" | "addedAt">;
  onSave: (data: Omit<EuthanasiaListing, "id" | "addedAt">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const valid = form.name.trim() && form.breed.trim() && form.shelter.trim() && form.location.trim() && form.deadline;

  return (
    <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Name *</label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Bruno" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Species *</label>
          <select
            value={form.species}
            onChange={e => set("species", e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Breed *</label>
          <Input value={form.breed} onChange={e => set("breed", e.target.value)} placeholder="e.g. Labrador Mix" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Age</label>
          <Input value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 3 years" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Gender</label>
          <select
            value={form.gender}
            onChange={e => set("gender", e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Status</label>
          <select
            value={form.status}
            onChange={e => set("status", e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="at-risk">At Risk</option>
            <option value="rescued">Rescued</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Shelter Name *</label>
          <Input value={form.shelter} onChange={e => set("shelter", e.target.value)} placeholder="e.g. LA City Shelter" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Location *</label>
          <Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Los Angeles, USA" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Deadline *</label>
          <Input
            type="date"
            value={form.deadline.slice(0, 10)}
            onChange={e => {
              const val = e.target.value;
              if (!val) { set("deadline", ""); return; }
              const d = new Date(val);
              set("deadline", isNaN(d.getTime()) ? val : d.toISOString());
            }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Photo URL</label>
          <ImageUploader
            value={form.image ? [form.image] : []}
            onChange={(urls) => set("image", urls[0] ?? "")}
            single={true}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Author Name</label>
          <Input value={form.author} onChange={e => set("author", e.target.value)} placeholder="e.g. Jane Smith or EuthList Team" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Description</label>
        <textarea
          value={form.description}
          onChange={e => set("description", e.target.value)}
          rows={3}
          placeholder="Describe the pet's personality, history, and why they need urgent help..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} size="sm"><X className="w-4 h-4 mr-1" /> Cancel</Button>
        <Button onClick={() => valid && onSave(form)} disabled={!valid} size="sm">
          <Save className="w-4 h-4 mr-1" /> Save Listing
        </Button>
      </div>
    </div>
  );
}

function ListingRow({
  listing,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  listing: EuthanasiaListing;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const days = daysUntil(listing.deadline);
  const isRescued = listing.status === "rescued";

  return (
    <div className={`bg-background rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
      isRescued ? "opacity-60 border-border" : days <= 3 ? "border-red-300 dark:border-red-800" : "border-border"
    }`}>
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
        {listing.image ? (
          <img src={listing.image} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">🐾</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="font-semibold text-foreground">{listing.name}</span>
          <span className="text-xs text-muted-foreground">{listing.breed} · {listing.age}</span>
          {isRescued ? (
            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-2 py-0.5 rounded-full">Rescued</span>
          ) : days <= 3 ? (
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30 px-2 py-0.5 rounded-full animate-pulse">
              {days <= 0 ? "Overdue" : `${days}d left`}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{days}d left</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          {listing.shelter}, {listing.location}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Clock className="w-3 h-3 shrink-0" />
          Deadline: {new Date(listing.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleStatus}
          className={`text-xs ${isRescued ? "text-orange-600 border-orange-300 hover:bg-orange-50" : "text-green-600 border-green-300 hover:bg-green-50"}`}
        >
          {isRescued ? <><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Mark At-Risk</> : <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Rescued</>}
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminEuthanasia() {
  const { euthanasiaListings, addEuthanasiaListing, updateEuthanasiaListing, deleteEuthanasiaListing } = useAdminData();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const sorted = [...euthanasiaListings].sort((a, b) => {
    if (a.status === "rescued" && b.status !== "rescued") return 1;
    if (b.status === "rescued" && a.status !== "rescued") return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const atRisk = euthanasiaListings.filter(l => l.status === "at-risk").length;
  const rescued = euthanasiaListings.filter(l => l.status === "rescued").length;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Euthanasia List
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage pets at risk of euthanasia. Mark as rescued when they find safety.
            </p>
          </div>
          <Button onClick={() => { setShowAdd(true); setEditId(null); }} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Add Listing
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{atRisk}</p>
            <p className="text-sm text-red-700 dark:text-red-300 font-medium mt-0.5">At Risk</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{rescued}</p>
            <p className="text-sm text-green-700 dark:text-green-300 font-medium mt-0.5">Rescued</p>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && !editId && (
          <ListingForm
            initial={EMPTY_FORM}
            onSave={(data) => {
              addEuthanasiaListing(data);
              setShowAdd(false);
              toast({ title: "Listing added", description: `${data.name} has been added to the urgent list.` });
            }}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {/* Listings */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No listings yet</p>
              <p className="text-sm">Click "Add Listing" to add a pet in need of rescue.</p>
            </div>
          ) : (
            sorted.map(listing => (
              <div key={listing.id}>
                {editId === listing.id ? (
                  <ListingForm
                    initial={{
                      name: listing.name, species: listing.species, breed: listing.breed,
                      age: listing.age, gender: listing.gender, shelter: listing.shelter,
                      location: listing.location, deadline: listing.deadline,
                      image: listing.image, description: listing.description, status: listing.status,
                      author: listing.author || "",
                    }}
                    onSave={(data) => {
                      updateEuthanasiaListing(listing.id, data);
                      setEditId(null);
                      toast({ title: "Listing updated", description: `${data.name}'s listing has been updated.` });
                    }}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <ListingRow
                    listing={listing}
                    onEdit={() => { setEditId(listing.id); setShowAdd(false); }}
                    onDelete={() => {
                      deleteEuthanasiaListing(listing.id);
                      toast({ title: "Listing removed", description: `${listing.name} has been removed.`, variant: "destructive" });
                    }}
                    onToggleStatus={() => {
                      const newStatus = listing.status === "at-risk" ? "rescued" : "at-risk";
                      updateEuthanasiaListing(listing.id, { status: newStatus });
                      toast({
                        title: newStatus === "rescued" ? "Marked as rescued!" : "Marked as at-risk",
                        description: `${listing.name} status updated.`,
                      });
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
