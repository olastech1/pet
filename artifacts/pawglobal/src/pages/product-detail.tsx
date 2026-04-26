import { PageTransition } from "@/components/PageTransition";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useParams, Link, useLocation } from "wouter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, ShieldCheck, Truck, ArrowLeft, Info, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { petDisplayId } from "@/lib/data";
import { SafeImg } from "@/components/ui/safe-img";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { allProducts } = useAdminData();
  const product = allProducts.find(p => p.id === id);
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The pet or supply you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const isAdopt = product.status === "adopt";
  const isSupply = product.type === "supply";

  const handleBuy = () => {
    addToCart(product, quantity);
    navigate("/checkout");
  };

  return (
    <PageTransition>
      <div className="bg-background min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <Link href={`/shop/${product.type}s`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to {product.type}s
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                <SafeImg
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {isAdopt && <Badge className="bg-primary hover:bg-primary">Rescue for Adoption</Badge>}
                  {product.category && <Badge variant="outline">{product.category}</Badge>}
                  {!isSupply && <Badge variant="secondary" className="capitalize">{product.gender}</Badge>}
                  <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                    {petDisplayId(product.id)}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">{product.name}</h1>
                {!isSupply && (
                  <p className="text-xl text-muted-foreground font-medium">{product.breed}</p>
                )}
              </div>

              <div className="text-3xl font-bold text-foreground mb-8">
                {formatPrice(product.priceNGN, product.priceUSD)}
              </div>

              <div className="prose prose-p:text-muted-foreground mb-8">
                <p className="text-lg leading-relaxed">{product.description}</p>
              </div>

              {!isSupply && (
                <div className="grid grid-cols-2 gap-4 mb-8 bg-muted/30 p-6 rounded-2xl">
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Age</span>
                    <span className="font-medium">{product.age}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Location</span>
                    <span className="font-medium">{product.location}</span>
                  </div>
                  <div className="col-span-2 mt-2 pt-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground block mb-3">Health Status</span>
                    <div className="flex gap-4">
                      {product.vaccinated && (
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> Vaccinated
                        </span>
                      )}
                      {product.dewormed && (
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> Dewormed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto space-y-6 pt-8 border-t">
                {isSupply && (
                  <div className="flex items-center gap-4 mb-4">
                    <label htmlFor="quantity" className="font-medium">Quantity:</label>
                    <div className="flex items-center border rounded-md">
                      <button 
                        className="px-3 py-1 hover:bg-muted transition-colors"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >-</button>
                      <span className="px-4 font-medium min-w-[3rem] text-center">{quantity}</span>
                      <button 
                        className="px-3 py-1 hover:bg-muted transition-colors"
                        onClick={() => setQuantity(quantity + 1)}
                      >+</button>
                    </div>
                  </div>
                )}

                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg" 
                  onClick={handleBuy}
                  data-testid="button-add-to-cart"
                >
                  {isAdopt ? (
                    <><Heart className="w-5 h-5 mr-2" /> Adopt {product.name}</>
                  ) : isSupply ? (
                    <><ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart</>
                  ) : (
                    <><ShoppingBag className="w-5 h-5 mr-2" /> Buy {product.name}</>
                  )}
                </Button>

                {!isSupply && (
                  <Button 
                    asChild 
                    size="lg" 
                    variant="outline"
                    className="w-full h-14 text-lg border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    data-testid="button-donate-for-pet"
                  >
                    <Link href={`/donate?pet=${encodeURIComponent(product.name)}&id=${petDisplayId(product.id)}`}>
                      <Heart className="w-5 h-5 mr-2 fill-red-500 text-red-500" /> Donate for {product.name}
                    </Link>
                  </Button>
                )}

                <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <p>EuthList Guarantee: {isSupply ? "100% authentic products" : "Healthy, vet-checked pets"}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="w-5 h-5 text-primary shrink-0" />
                    <p>International shipping available. Rates calculated at checkout.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-primary shrink-0" />
                    <p>Need help? Contact our support team via WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
