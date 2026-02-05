import { fetchAdminProducts, fetchInventoryTable } from '@/services/products.service';
import { fetchBrands } from '@/services/brands.service';
import { fetchCategories } from '@/services/categories.service';
import { AdminProduct, InventoryTableItem } from '@/types/product.types';
import { Brand } from '@/types/brand.types';
import { Category } from '@/types/category.types';
import ProductsManagement from '@/components/admin/ProductsManagement';
import InventoryTable from '@/components/admin/InventoryTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Force dynamic rendering (required for authentication)
export const dynamic = 'force-dynamic';

async function getInitialData(): Promise<{
  products: AdminProduct[];
  brands: Brand[];
  categories: Category[];
  inventoryData: InventoryTableItem[];
  inventoryMeta: { page: number; size: number; totalElements: number; totalPages: number };
}> {
  const session = await getServerSession(authOptions);
  
  console.log('🔍 [Products Page] Session exists:', !!session);
  console.log('🔍 [Products Page] Session user:', (session as any)?.user?.email);
  console.log('🔍 [Products Page] Backend token exists:', !!(session as any)?.backendToken);
  console.log('🔍 [Products Page] Token length:', (session as any)?.backendToken?.length || 0);
  
  const token = (session as any)?.backendToken || '';

  if (!token) {
    console.error('❌ [Products Page] No backend token found in session!');
    console.error('❌ [Products Page] Please log out and log back in to refresh your session');
    return { 
      products: [], 
      brands: [], 
      categories: [],
      inventoryData: [],
      inventoryMeta: { page: 0, size: 20, totalElements: 0, totalPages: 0 }
    };
  }

  // Decode token to check expiry (optional)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const exp = payload.exp ? new Date(payload.exp * 1000) : null;
      const now = new Date();
      console.log('🔍 [Products Page] Token expires at:', exp?.toISOString());
      console.log('🔍 [Products Page] Current time:', now.toISOString());
      console.log('🔍 [Products Page] Token is expired:', exp ? exp < now : 'unknown');
      
      if (exp && exp < now) {
        console.error('❌ [Products Page] Token has expired! Please log out and log back in.');
      }
    }
  } catch (e) {
    console.log('🔍 [Products Page] Could not decode token for expiry check');
  }

  const [productsRes, brandsRes, categoriesRes, inventoryRes] = await Promise.all([
    fetchAdminProducts(0, 20, token),
    fetchBrands(),
    fetchCategories(),
    fetchInventoryTable(0, 20, 'name', 'asc', token),
  ]);

  console.log('📦 [Products Page] Products response:', {
    success: productsRes.success,
    hasData: !!productsRes.data,
    count: productsRes.data?.content?.length || 0,
    message: productsRes.message
  });

  const products: AdminProduct[] = productsRes.success && productsRes.data ? productsRes.data.content : [];
  const brands: Brand[] = brandsRes.success && brandsRes.data ? brandsRes.data : [];
  const categories: Category[] = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];
  const inventoryData: InventoryTableItem[] = inventoryRes.success && inventoryRes.data?.content ? inventoryRes.data.content : [];
  const inventoryMeta = inventoryRes.success && inventoryRes.data ? {
    page: inventoryRes.data.page,
    size: inventoryRes.data.size,
    totalElements: inventoryRes.data.totalElements,
    totalPages: inventoryRes.data.totalPages,
  } : { page: 0, size: 20, totalElements: 0, totalPages: 0 };

  return { products, brands, categories, inventoryData, inventoryMeta };
}

export default async function ProductsPage() {
  try {
    const data = await getInitialData();
    
    return (
      <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-background via-background to-background/80">
        <Tabs defaultValue="grid" className="w-full">
          {/* Enhanced Header */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    📦
                  </div>
                  Products
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Manage inventory with images, brands, and categories
                </p>
              </div>
              <TabsList className="grid w-full sm:w-auto grid-cols-2 h-10">
                <TabsTrigger value="grid" className="text-sm">
                  Grid
                </TabsTrigger>
                <TabsTrigger value="table" className="text-sm">
                  Table
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold">{data.products.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground">Brands</p>
                <p className="text-lg sm:text-2xl font-bold">{data.brands.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="text-lg sm:text-2xl font-bold">{data.categories.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border hidden sm:block">
                <p className="text-xs text-muted-foreground">Total Stock Value</p>
                <p className="text-lg sm:text-2xl font-bold">
                  ${(data.products.reduce((sum, p) => sum + (p.costPrice * p.stockQuantity), 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <TabsContent value="grid" className="mt-0">
            <ProductsManagement
              initialProducts={data.products}
              brands={data.brands}
              categories={data.categories}
            />
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <InventoryTable
              initialData={data.inventoryData}
              initialPage={data.inventoryMeta.page}
              initialSize={data.inventoryMeta.size}
              initialTotalElements={data.inventoryMeta.totalElements}
              initialTotalPages={data.inventoryMeta.totalPages}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('❌ [Products Page] Fatal error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-red-700 dark:text-red-300 mb-4">
            Unable to load products. Your session may have expired.
          </p>
          <a 
            href="/login" 
            className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Log In Again
          </a>
        </div>
      </div>
    );
  }
}
