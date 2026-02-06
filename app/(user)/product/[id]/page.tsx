'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchProductDetail } from '@/services/products.service';
import type { ProductDetail } from '@/types/product.types';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Package, 
  Tag,
  ArrowLeft,
  Minus,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;

      try {
        setLoading(true);
        const response = await fetchProductDetail(productId);
        
        if (response.success && response.data) {
          setProduct(response.data);
          setSelectedImage(response.data.imageUrl);
          console.log('✅ Product loaded:', response.data);
        } else {
          toast.error(response.message || 'Failed to load product');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    if (action === 'increase' && quantity < (product?.stockQuantity || 1)) {
      setQuantity(q => q + 1);
    } else if (action === 'decrease' && quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    toast.success(`Added ${quantity} ${product?.name} to cart!`);
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    toast.info('Buy now feature coming soon!');
  };

  const handleAddToWishlist = () => {
    // TODO: Implement wishlist functionality
    toast.success('Added to wishlist!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const discountAmount = product.price - product.discountedPrice;
  const hasDiscount = product.discountPercent > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
              <Image
                src={selectedImage || product.imageUrl || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-contain p-4"
                unoptimized
              />
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-bold">
                  -{product.discountPercent}%
                </div>
              )}
              {product.stockQuantity === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg text-lg font-bold">
                    OUT OF STOCK
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images (placeholder for future multiple images) */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedImage(product.imageUrl)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === product.imageUrl 
                    ? 'border-primary' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Image
                  src={product.imageUrl || '/placeholder.png'}
                  alt={product.name}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </button>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{product.category.name}</span>
              {product.brand && (
                <>
                  <span>/</span>
                  <span>{product.brand.name}</span>
                </>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(product.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({(product.averageRating || 0).toFixed(1)})
                  </span>
                </div>
                
                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className={`text-sm font-medium ${
                    product.stockQuantity > 10 
                      ? 'text-green-600' 
                      : product.stockQuantity > 0 
                      ? 'text-orange-600' 
                      : 'text-destructive'
                  }`}>
                    {product.stockQuantity > 10 
                      ? 'In Stock' 
                      : product.stockQuantity > 0 
                      ? `Only ${product.stockQuantity} left!` 
                      : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  ${product.discountedPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-2xl text-muted-foreground line-through">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      Save ${discountAmount.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
              {product.barcode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span>Barcode: {product.barcode}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Brand & Category */}
            <div className="border-t pt-4 space-y-3">
              {product.brand && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">Brand:</span>
                  <div className="flex items-center gap-2">
                    {product.brand.logoUrl && (
                      <div className="relative w-8 h-8 rounded overflow-hidden">
                        <Image
                          src={product.brand.logoUrl}
                          alt={product.brand.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="font-medium">{product.brand.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-20">Category:</span>
                <span className="font-medium">{product.category.name}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.stockQuantity > 0 && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity === 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange('increase')}
                      disabled={quantity >= product.stockQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.stockQuantity} available)
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t pt-6 space-y-3">
              {product.stockQuantity > 0 ? (
                <>
                  <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Out of Stock
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleAddToWishlist}
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Wishlist
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
              <p>• Free shipping on orders over $50</p>
              <p>• 30-day return policy</p>
              <p>• Secure payment methods</p>
              <p>• Customer support available 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
