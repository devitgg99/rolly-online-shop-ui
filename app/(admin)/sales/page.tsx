import { fetchSales, fetchTodaySummary } from '@/services/sales.service';
import { fetchAdminProducts } from '@/services/products.service';
import { fetchCategories } from '@/services/categories.service';
import { SaleListItem, SaleSummary } from '@/types/sales.types';
import { AdminProduct } from '@/types/product.types';
import { Category } from '@/types/category.types';
import SalesManagement from '@/components/admin/SalesManagement';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Force dynamic rendering (required for authentication)
export const dynamic = 'force-dynamic';

async function getInitialData() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.backendToken || '';

  console.log('🔍 Sales Page - Session exists:', !!session);
  console.log('🔍 Sales Page - Token exists:', !!token);
  console.log('🔍 Sales Page - Token length:', token?.length || 0);

  const [salesRes, summaryRes, productsRes, categoriesRes] = await Promise.all([
    fetchSales(0, 20, token),
    fetchTodaySummary(token),
    fetchAdminProducts(0, 100, token), // Fetch products for selection
    fetchCategories(), // Fetch categories for filtering
  ]);

  console.log('📦 Products fetch result:', productsRes.success, productsRes.message);
  console.log('📦 Products data:', productsRes.data);
  console.log('📦 Categories fetch result:', categoriesRes.success);

  const sales: SaleListItem[] = salesRes.success && salesRes.data?.content ? salesRes.data.content : [];
  const summary: SaleSummary | null = summaryRes.success && summaryRes.data ? summaryRes.data : null;
  const products: AdminProduct[] = productsRes.success && productsRes.data?.content ? productsRes.data.content : [];
  const categories: Category[] = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];

  console.log('📦 Final counts - Sales:', sales.length, 'Products:', products.length, 'Categories:', categories.length);

  return { sales, summary, products, categories };
}

export default async function SalesPage() {
  try {
    const { sales, summary, products, categories } = await getInitialData();
    
    console.log('🎯 Rendering SalesManagement with:', {
      sales: sales?.length ?? 'undefined',
      summary: summary ? 'exists' : 'null',
      products: products?.length ?? 'undefined',
      categories: categories?.length ?? 'undefined'
    });
    
    return (
      <SalesManagement
        initialSales={sales}
        initialSummary={summary}
        availableProducts={products}
        categories={categories}
      />
    );
  } catch (error) {
    console.error('❌ Error in SalesPage:', error);
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Sales</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }
}
