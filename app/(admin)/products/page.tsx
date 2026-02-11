import { fetchAdminProducts, fetchInventoryTable } from '@/services/products.service';
import { fetchCategories } from '@/services/categories.service';
import { AdminProduct, InventoryTableItem } from '@/types/product.types';
import { Category } from '@/types/category.types';
import ProductsManagement from '@/components/admin/ProductsManagement';
import InventoryTable from '@/components/admin/InventoryTable';
import ProductsByCategory from '@/components/admin/ProductsByCategory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Force dynamic rendering (required for authentication)
export const dynamic = 'force-dynamic';

async function getInitialData(): Promise<{
  products: AdminProduct[];
  categories: Category[];
  inventoryData: InventoryTableItem[];
  inventoryMeta: { page: number; size: number; totalElements: number; totalPages: number };
}> {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.backendToken || '';

  if (!token) {
    return { 
      products: [], 
      categories: [],
      inventoryData: [],
      inventoryMeta: { page: 0, size: 20, totalElements: 0, totalPages: 0 }
    };
  }

  const [productsRes, categoriesRes, inventoryRes] = await Promise.all([
    fetchAdminProducts(0, 20, token),
    fetchCategories(),
    fetchInventoryTable(0, 20, 'name', 'asc', token),
  ]);

  const products: AdminProduct[] = productsRes.success && productsRes.data ? productsRes.data.content : [];
  const categories: Category[] = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];
  const inventoryData: InventoryTableItem[] = inventoryRes.success && inventoryRes.data?.content ? inventoryRes.data.content : [];
  const inventoryMeta = inventoryRes.success && inventoryRes.data ? {
    page: inventoryRes.data.page,
    size: inventoryRes.data.size,
    totalElements: inventoryRes.data.totalElements,
    totalPages: inventoryRes.data.totalPages,
  } : { page: 0, size: 20, totalElements: 0, totalPages: 0 };

  return { products, categories, inventoryData, inventoryMeta };
}

export default async function ProductsPage() {
  try {
    const data = await getInitialData();
    
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Products 📦</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage your product inventory
              </p>
            </div>
            <TabsList className="grid w-full sm:w-auto grid-cols-3 h-9 sm:h-10">
              <TabsTrigger value="category" className="text-xs sm:text-sm">
                By Category
              </TabsTrigger>
              <TabsTrigger value="grid" className="text-xs sm:text-sm">
                Grid View
              </TabsTrigger>
              <TabsTrigger value="table" className="text-xs sm:text-sm">
                Inventory Table
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="category" className="mt-0">
            <ProductsByCategory
              categories={data.categories}
            />
          </TabsContent>

          <TabsContent value="grid" className="mt-0">
            <ProductsManagement
              initialProducts={data.products}
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
              categories={data.categories}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">⚠️ Authentication Error</h1>
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
