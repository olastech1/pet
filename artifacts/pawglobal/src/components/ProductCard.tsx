import { Product, petDisplayId } from "@/lib/data";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "wouter";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { SafeImg } from "@/components/ui/safe-img";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const isAdopt = product.status === "adopt";
  const isSupply = product.type === "supply";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden group h-full flex flex-col border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card">
        <Link href={`/shop/${product.id}`} className="block relative overflow-hidden aspect-[4/3]">
          <SafeImg
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isAdopt && (
              <Badge variant="default" className="bg-primary hover:bg-primary text-white font-medium border-none shadow-sm shadow-black/20">
                Rescue for Adoption
              </Badge>
            )}
            {!isSupply && !isAdopt && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm hover:bg-background border-none shadow-sm shadow-black/10">
                Premium Pet
              </Badge>
            )}
            {isSupply && product.category && (
              <Badge variant="outline" className="bg-background/90 backdrop-blur-sm hover:bg-background border-none shadow-sm shadow-black/10">
                {product.category}
              </Badge>
            )}
          </div>
        </Link>
        
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-serif font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">
                  <Link href={`/shop/${product.id}`}>{product.name}</Link>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!isSupply && (
                  <p className="text-sm text-muted-foreground font-medium">{product.breed}</p>
                )}
                <span className="text-[10px] font-mono font-bold text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded">
                  {petDisplayId(product.id)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-bold ${isAdopt ? 'text-primary' : 'text-foreground'}`}>
                {formatPrice(product.priceNGN, product.priceUSD)}
              </span>
            </div>
          </div>
          
          {!isSupply && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
              <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                {product.age}
              </span>
              <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md capitalize">
                {product.gender}
              </span>
              <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md truncate max-w-[100px]">
                {product.location}
              </span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-5 pt-0 mt-auto">
          <div className={`w-full ${!isSupply ? "flex gap-2" : ""}`}>
            <Button asChild className={`${!isSupply ? "flex-1" : "w-full"} group/btn`} variant={isAdopt ? "default" : "outline"} data-testid={`button-view-${product.id}`}>
              <Link href={`/shop/${product.id}`}>
                {isAdopt ? (
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 group-hover/btn:fill-current transition-all" /> Meet {product.name}
                  </span>
                ) : isSupply ? (
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> View Details
                  </span>
                ) : (
                  "View Details"
                )}
              </Link>
            </Button>
            {!isSupply && (
              <Button asChild variant="outline" size="icon" className="shrink-0 border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors" data-testid={`button-donate-${product.id}`} title={`Donate for ${product.name}`}>
                <Link href={`/donate?pet=${encodeURIComponent(product.name)}&id=${petDisplayId(product.id)}`}>
                  <Heart className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
