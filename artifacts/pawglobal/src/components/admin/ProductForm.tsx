import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Product } from "@/lib/data";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "./ImageUploader";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["dog", "cat", "supply"]),
  category: z.string().optional(),
  breed: z.string().optional(),
  age: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  author: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  priceNGN: z.coerce.number().min(0, "Price must be 0 or more"),
  priceUSD: z.coerce.number().min(0, "Price must be 0 or more"),
  status: z.enum(["sale", "adopt"]),
  description: z.string().min(1, "Description is required"),
  images: z.string().default(""),
  vaccinated: z.boolean().optional(),
  dewormed: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: Partial<Product>;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({ defaultValues, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "dog",
      category: defaultValues?.category ?? "",
      breed: defaultValues?.breed ?? "",
      age: defaultValues?.age ?? "",
      gender: defaultValues?.gender ?? undefined,
      author: defaultValues?.author ?? "",
      location: defaultValues?.location ?? "London",
      priceNGN: defaultValues?.priceNGN ?? 0,
      priceUSD: defaultValues?.priceUSD ?? 0,
      status: defaultValues?.status ?? "sale",
      description: defaultValues?.description ?? "",
      images: defaultValues?.images?.join("\n") ?? "",
      vaccinated: defaultValues?.vaccinated ?? false,
      dewormed: defaultValues?.dewormed ?? false,
    },
  });

  const handleSubmit = (values: ProductFormValues) => {
    const product: Omit<Product, "id"> = {
      name: values.name,
      type: values.type,
      location: values.location,
      priceNGN: values.priceNGN,
      priceUSD: values.priceUSD,
      status: values.status,
      description: values.description,
      images: values.images.split("\n").map(s => s.trim()).filter(Boolean),
      category: values.category || undefined,
      breed: values.breed || undefined,
      age: values.age || undefined,
      gender: values.gender,
      author: values.author || undefined,
      vaccinated: values.vaccinated,
      dewormed: values.dewormed,
    };
    onSubmit(product);
  };

  const productType = form.watch("type");
  const isPet = productType === "dog" || productType === "cat";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl><Input placeholder="e.g. Loki" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="supply">Supply</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {isPet ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="breed" render={({ field }) => (
                <FormItem>
                  <FormLabel>Breed</FormLabel>
                  <FormControl><Input placeholder="e.g. Golden Retriever" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl><Input placeholder="e.g. 3 months" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="author" render={({ field }) => (
              <FormItem>
                <FormLabel>Listed by (Author)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. EuthList Team or Jane Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        ) : (
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Grooming">Grooming</SelectItem>
                  <SelectItem value="Housing">Housing</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <FormControl><Input placeholder="e.g. London" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="priceUSD" render={({ field }) => (
            <FormItem>
              <FormLabel>Price (USD) *</FormLabel>
              <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Listing Status *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="adopt">For Adoption (Free)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description *</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Describe the pet or product..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="images" render={({ field }) => (
          <FormItem>
            <FormLabel>Images *</FormLabel>
            <FormControl>
              <ImageUploader
                value={field.value ? field.value.split("\n").map((s: string) => s.trim()).filter(Boolean) : []}
                onChange={(urls) => field.onChange(urls.join("\n"))}
                max={5}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {isPet && (
          <div className="flex gap-6">
            <FormField control={form.control} name="vaccinated" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Vaccinated</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="dewormed" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Dewormed</FormLabel>
              </FormItem>
            )} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-form">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-product">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
