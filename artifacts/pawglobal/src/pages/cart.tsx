import { PageTransition } from "@/components/PageTransition";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalNGN, totalUSD } = useCart();
  const { formatPrice } = useCurrency();

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
          <div className="bg-muted/30 p-8 rounded-full mb-6">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Looks like you haven't added any pets or supplies to your cart yet.</p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/shop/dogs">Shop Dogs</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/shop/supplies">Shop Supplies</Link>
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <h1 className="text-4xl font-serif font-bold mb-10">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.product.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-background border rounded-2xl shadow-sm relative pr-12">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(item.product.id)}
                  data-testid={`button-remove-${item.product.id}`}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>

                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-muted">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-xl mb-1">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize mb-2">{item.product.type} {item.product.breed ? `· ${item.product.breed}` : ''}</p>
                    <p className="font-bold text-lg">{formatPrice(item.product.priceNGN, item.product.priceUSD)}</p>
                  </div>

                  {item.product.type === 'supply' && (
                    <div className="flex items-center border rounded-lg w-max mt-4">
                      <button 
                        className="p-2 hover:bg-muted transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      ><Minus className="w-4 h-4" /></button>
                      <span className="px-4 font-medium min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button 
                        className="p-2 hover:bg-muted transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      ><Plus className="w-4 h-4" /></button>
                    </div>
                  )}
                  {item.product.type !== 'supply' && (
                    <div className="mt-4 text-sm font-medium text-primary">
                      Quantity: 1 (Unique Pet)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-muted/20 p-8 rounded-3xl border border-border/50 sticky top-24">
              <h3 className="text-xl font-serif font-bold mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalNGN, totalUSD)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground pb-4 border-b border-border/50">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>{formatPrice(totalNGN, totalUSD)}</span>
                </div>
              </div>

              <Button asChild size="lg" className="w-full h-14 text-lg">
                <Link href="/checkout">Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" /></Link>
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Secure payments processed via Paystack or Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
