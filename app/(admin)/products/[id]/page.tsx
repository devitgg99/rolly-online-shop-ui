'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { fetchAdminProductDetail } from '@/services/products.service';
import type { AdminProductDetail } from '@/types/product.types';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ArrowLeft,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  Tag,
  Calendar,
  Box,
  Layers,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const productId = params.id as string;

  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!productId || !session?.backendToken) {
        if (!session?.backendToken) {
          toast.error('Authentication required');
          router.push('/login');
        }
        return;
      }

      try {
        setLoading(true);
        const response = await fetchAdminProductDetail(productId, session.backendToken);
        
        if (response.success && response.data) {
          setProduct(response.data);
          console.log('✅ Admin Product loaded:', response.data);
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
  }, [productId, session, router]);

  const handleEdit = () => {
    // TODO: Open edit dialog or navigate to edit page
    toast.info('Edit functionality - integrate with ProductsManagement');
  };

  const handleDelete = () => {
    // TODO: Implement delete with confirmation
    toast.info('Delete functionality coming soon');
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
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const profit = product.profit;
  const profitMargin = product.costPrice ? ((profit / product.discountedPrice) * 100) : 0;
  const totalInventoryValue = product.costPrice * product.stockQuantity;
  const potentialRevenue = product.discountedPrice * product.stockQuantity;
  const potentialProfit = profit * product.stockQuantity;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Product
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Image & Basic Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                  <Image
                    src={product.imageUrl || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    unoptimized
                  />
                  {product.discountPercent > 0 && (
                    <Badge variant="destructive" className="absolute top-2 left-2">
                      -{product.discountPercent}%
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={product.stockQuantity > 10 ? 'default' : product.stockQuantity > 0 ? 'secondary' : 'destructive'}>
                      {product.stockQuantity > 10 ? 'In Stock' : product.stockQuantity > 0 ? 'Low Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                  
                  {product.barcode && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Barcode:</span>
                      <span className="font-mono">{product.barcode}</span>
                    </div>
                  )}
                  
                  {product.brand && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{product.brand.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{product.category.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(product.averageRating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Financial & Inventory Details */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing & Profit Analysis 💰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cost Price</p>
                    <p className="text-2xl font-bold">${product.costPrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">What you paid</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
                    {product.discountPercent > 0 && (
                      <p className="text-xs text-orange-600">Before discount</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Final Price</p>
                    <p className="text-2xl font-bold text-primary">${product.discountedPrice.toFixed(2)}</p>
                    {product.discountPercent > 0 && (
                      <p className="text-xs text-green-600">After {product.discountPercent}% off</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Profit per Unit</p>
                    <p className={`text-2xl font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% margin</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Discount Amount</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${(product.price - product.discountedPrice).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.discountPercent}% off</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory & Revenue Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Inventory & Revenue Potential 📦
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Stock Quantity</p>
                    <p className="text-3xl font-bold">{product.stockQuantity}</p>
                    <p className="text-xs text-muted-foreground">Units available</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Inventory Value</p>
                    <p className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Cost × Stock</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Potential Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">${potentialRevenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">If all sold</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Profit Potential</p>
                    <p className={`text-2xl font-bold ${potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${potentialProfit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">If all sold</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Product Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
              </CardContent>
            </Card>

            {/* Brand & Category Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    {product.brand.logoUrl && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={product.brand.logoUrl}
                          alt={product.brand.name}
                          fill
                          className="object-contain p-2"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{product.brand.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.brand.description || 'No description available'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(product.brand.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    {product.category.imageUrl && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={product.category.imageUrl}
                          alt={product.category.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{product.category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.category.description || 'No description available'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(product.category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
