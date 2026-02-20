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
          toast.error('ត្រូវការការផ្ទៀងផ្ទាត់');
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
  }, [productId, session, router]);

  const handleEdit = () => {
    // TODO: Open edit dialog or navigate to edit page
    toast.info('មុខងារកែសម្រួល - រួមបញ្ចូលជាមួយ ProductsManagement');
  };

  const handleDelete = () => {
    // TODO: Implement delete with confirmation
    toast.info('មុខងារលុបនឹងមានឆាប់ៗ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">កំពុងផ្ទុកព័ត៌មានផលិតផល...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">រកមិនឃើញផលិតផល</h2>
          <p className="text-muted-foreground">ផលិតផលដែលអ្នកកំពុងស្វែងរកមិនមានទេ។</p>
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            ត្រឡប់ទៅផលិតផល
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
            ត្រឡប់ទៅផលិតផល
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              កែសម្រួលផលិតផល
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              លុប
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
                    <span className="text-muted-foreground">ស្ថានភាព:</span>
                    <Badge variant={product.stockQuantity > 10 ? 'default' : product.stockQuantity > 0 ? 'secondary' : 'destructive'}>
                      {product.stockQuantity > 10 ? 'នៅក្នុងស្តុក' : product.stockQuantity > 0 ? 'ស្តុកទាប' : 'អស់ពីស្តុក'}
                    </Badge>
                  </div>
                  
                  {product.barcode && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">បាកូដ:</span>
                      <span className="font-mono">{product.barcode}</span>
                    </div>
                  )}
                  
                  {product.brand && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ម៉ាក:</span>
                      <span className="font-medium">{product.brand.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ប្រភេទ:</span>
                    <span className="font-medium">{product.category.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">វាយតម្លៃ:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(product.averageRating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">បង្កើត:</span>
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
                  ការវិភាគតម្លៃ និងចំណេញ 💰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">តម្លៃដើម</p>
                    <p className="text-2xl font-bold">${product.costPrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">តម្លៃដែលអ្នកទិញ</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">តម្លៃលក់</p>
                    <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
                    {product.discountPercent > 0 && (
                      <p className="text-xs text-orange-600">មុនបញ្ចុះតម្លៃ</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">តម្លៃចុងក្រោយ</p>
                    <p className="text-2xl font-bold text-primary">${product.discountedPrice.toFixed(2)}</p>
                    {product.discountPercent > 0 && (
                      <p className="text-xs text-green-600">បន្ទាប់ពីបញ្ចុះ {product.discountPercent}%</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ចំណេញក្នុងមួយឯកតា</p>
                    <p className={`text-2xl font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% អត្រា</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ចំនួនបញ្ចុះតម្លៃ</p>
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
                  ស្តុក និងសក្តានុពលចំណូល 📦
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">បរិមាណស្តុក</p>
                    <p className="text-3xl font-bold">{product.stockQuantity}</p>
                    <p className="text-xs text-muted-foreground">ឯកតាដែលមាន</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">តម្លៃស្តុក</p>
                    <p className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">តម្លៃដើម × ស្តុក</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ចំណូលសក្តានុពល</p>
                    <p className="text-2xl font-bold text-blue-600">${potentialRevenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">បើលក់អស់</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">សក្តានុពលចំណេញសរុប</p>
                    <p className={`text-2xl font-bold ${potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${potentialProfit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">បើលក់អស់</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  ការពិពណ៌នាផលិតផល
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'គ្មានការពិពណ៌នាសម្រាប់ផលិតផលនេះ។'}
                </p>
              </CardContent>
            </Card>

            {/* Brand & Category Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.brand && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ព័ត៌មានម៉ាក</CardTitle>
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
                          {product.brand.description || 'គ្មានការពិពណ៌នា'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          បង្កើត: {new Date(product.brand.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ព័ត៌មានប្រភេទ</CardTitle>
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
                        {product.category.description || 'គ្មានការពិពណ៌នា'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        បង្កើត: {new Date(product.category.createdAt).toLocaleDateString()}
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
