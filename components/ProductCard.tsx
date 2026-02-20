'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatUSD, formatKHR } from '@/lib/currency';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  discountPercent?: number;
  imageUrl: string;
  stockQuantity?: number;
  averageRating?: number;
  brandName?: string;
  categoryName?: string;
  isNew?: boolean;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
}

export function ProductCard({
  id,
  name,
  price,
  discountedPrice,
  discountPercent = 0,
  imageUrl,
  stockQuantity = 0,
  averageRating = 0,
  isNew = false,
  onAddToCart,
  onAddToWishlist,
}: ProductCardProps) {
  const displayPrice = discountedPrice && discountedPrice < price ? discountedPrice : price;
  const hasDiscount = discountPercent > 0;
  const isOutOfStock = stockQuantity === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      toast.error('ផលិតផលអស់ពីស្តុក');
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(id);
    } else {
      toast.success(`បានដាក់ ${name} ក្នុងកន្រ្តក!`);
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToWishlist) {
      onAddToWishlist(id);
    } else {
      toast.success(`បានដាក់ ${name} ក្នុងបញ្ជីចង់បាន!`);
    }
  };

  return (
    <Link 
      href={`/product/${id}`}
      className="bg-card rounded-xl sm:rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border border-border hover:border-primary/30 hover:-translate-y-1 cursor-pointer block relative"
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-56 lg:h-64 bg-muted overflow-hidden">
        <Image
          src={imageUrl || '/placeholder.png'}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-bold">
              អស់ពីស្តុក
            </span>
          </div>
        )}
        
        {/* Wishlist Button */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-white/90 hover:bg-white hover:scale-110 transition-all shadow-lg w-8 h-8 sm:w-10 sm:h-10"
            onClick={handleAddToWishlist}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary hover:fill-primary transition-all" />
          </Button>
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex flex-col gap-2">
          {isNew && (
            <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
              ថ្មី
            </span>
          )}
          {hasDiscount && !isOutOfStock && (
            <span className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
        {/* Rating */}
        {averageRating > 0 && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
            <span className="text-xs sm:text-sm text-foreground/60 ml-1 sm:ml-2">
              ({averageRating.toFixed(1)})
            </span>
          </div>
        )}
        
        {/* Name */}
        <h3 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {name}
        </h3>
        
        {/* Stock Warning */}
        {!isOutOfStock && stockQuantity > 0 && stockQuantity <= 10 && (
          <p className="text-xs text-orange-600 font-medium">
            នៅសល់តែ {stockQuantity} ក្នុងស្តុក!
          </p>
        )}
        
        {/* Price & Add to Cart */}
        <div className="flex justify-between items-center pt-3 sm:pt-4">
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              {formatUSD(displayPrice)}
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground/70">
              {formatKHR(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatUSD(price)}
              </span>
            )}
          </div>
          
          <Button 
            variant="default" 
            size="sm" 
            className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 text-xs sm:text-sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            {isOutOfStock ? 'អស់ពីស្តុក' : 'ដាក់ក្នុងកន្រ្តក'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
