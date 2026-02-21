'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
import { ProductDetailSkeleton } from '@/components/skeletons';
import { formatUSD, formatKHR } from '@/lib/currency';

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
          toast.error(response.message || 'មិនអាចផ្ទុកផលិតផល');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        toast.error('មិនអាចផ្ទុកព័ត៌មានផលិតផល');
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
    toast.success(`បានដាក់ ${quantity} ${product?.name} ក្នុងកន្រ្តក!`);
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    toast.info('មុខងារទិញឥឡូវនឹងមានឆាប់ៗ!');
  };

  const handleAddToWishlist = () => {
    // TODO: Implement wishlist functionality
    toast.success('បានដាក់ក្នុងបញ្ជីចង់បាន!');
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
      toast.success('បានចម្លងតំណភ្ជាប់!');
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">រកមិនឃើញផលិតផល</h2>
          <p className="text-muted-foreground">ផលិតផលដែលអ្នកកំពុងស្វែងរកមិនមានទេ ឬបានដកចេញហើយ។</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ត្រឡប់ទៅទំព័រដើម
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/#products">រុករកផលិតផល</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const discountAmount = product.price - product.discountedPrice;
  const hasDiscount = product.discountPercent > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          ត្រឡប់
        </Button>
        <span className="text-muted-foreground/60">|</span>
        <Button variant="ghost" size="sm" asChild className="text-primary">
          <Link href="/#products">រុករកផលិតផល</Link>
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
                    អស់ពីស្តុក
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
                      ? 'នៅក្នុងស្តុក' 
                      : product.stockQuantity > 0 
                      ? `នៅសល់តែ ${product.stockQuantity} ប៉ុណ្ណោះ!` 
                      : 'អស់ពីស្តុក'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  {formatUSD(product.discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-2xl text-muted-foreground line-through">
                    {formatUSD(product.price)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-foreground/80">
                  {formatKHR(product.discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-lg font-semibold text-green-600">
                    សន្សំ {formatUSD(discountAmount)}
                  </span>
                )}
              </div>
              {product.barcode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span>បាកូដ: {product.barcode}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">ការពិពណ៌នា</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'គ្មានការពិពណ៌នាសម្រាប់ផលិតផលនេះ។'}
              </p>
            </div>

            {/* Brand & Category */}
            <div className="border-t pt-4 space-y-3">
              {product.brand && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-20">ម៉ាក:</span>
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
                <span className="text-sm text-muted-foreground w-20">ប្រភេទ:</span>
                <span className="font-medium">{product.category.name}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.stockQuantity > 0 && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">ចំនួន</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={quantity === 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-medium tabular-nums" aria-live="polite">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuantityChange('increase')}
                      disabled={quantity >= product.stockQuantity}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.stockQuantity} មាន)
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons - desktop */}
            <div className="border-t pt-6 space-y-3 max-lg:hidden">
              {product.stockQuantity > 0 ? (
                <>
                  <Button size="lg" className="w-full" onClick={handleBuyNow}>
                    ទិញឥឡូវ
                  </Button>
                  <Button size="lg" variant="outline" className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    ដាក់ក្នុងកន្រ្តក
                  </Button>
                </>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  អស់ពីស្តុក
                </Button>
              )}
              <div className="flex gap-3">
                <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToWishlist}>
                  <Heart className="w-5 h-5 mr-2" />
                  បញ្ជីចង់បាន
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="w-5 h-5 mr-2" />
                  ចែករំលែក
                </Button>
              </div>
            </div>

            {/* Wishlist + Share only on mobile (main CTAs in sticky bar) */}
            <div className="border-t pt-4 flex gap-3 lg:hidden">
              <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToWishlist}>
                <Heart className="w-5 h-5 mr-2" />
                បញ្ជីចង់បាន
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="w-5 h-5 mr-2" />
                ចែករំលែក
              </Button>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
              <p>• ដឹកជញ្ជូនឥតគិតថ្លៃសម្រាប់ការបញ្ជាទិញលើស $50</p>
              <p>• គោលការណ៍ប្រគល់វិញ 30 ថ្ងៃ</p>
              <p>• វិធីបង់ប្រាក់មានសុវត្ថិភាព</p>
              <p>• ជំនួយអតិថិជន 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA on mobile */}
      {product.stockQuantity > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur border-t border-border safe-area-pb">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button size="lg" variant="outline" className="flex-1 min-h-12" onClick={handleAddToCart}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              ដាក់ក្នុងកន្រ្តក
            </Button>
            <Button size="lg" className="flex-1 min-h-12" onClick={handleBuyNow}>
              ទិញឥឡូវ
            </Button>
          </div>
        </div>
      )}
      {product.stockQuantity > 0 && <div className="lg:hidden h-24" />}
    </div>
  );
}
