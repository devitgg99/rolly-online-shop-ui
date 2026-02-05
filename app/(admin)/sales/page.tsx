import { fetchSales, fetchTodaySummary } from '@/services/sales.service';
import { fetchAdminProducts } from '@/services/products.service';
import { SaleListItem, SaleSummary } from '@/types/sales.types';
import { AdminProduct } from '@/types/product.types';
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

  const [salesRes, summaryRes, productsRes] = await Promise.all([
    fetchSales(0, 20, token),
    fetchTodaySummary(token),
    fetchAdminProducts(0, 100, token), // Fetch products for selection
  ]);

  console.log('📦 Products fetch result:', productsRes.success, productsRes.message);
  console.log('📦 Products data:', productsRes.data);

  const sales: SaleListItem[] = salesRes.success && salesRes.data?.content ? salesRes.data.content : [];
  const summary: SaleSummary | null = summaryRes.success && summaryRes.data ? summaryRes.data : null;
  const products: AdminProduct[] = productsRes.success && productsRes.data?.content ? productsRes.data.content : [];

  console.log('📦 Final counts - Sales:', sales.length, 'Products:', products.length);

  return { sales, summary, products };
}

export default async function SalesPage() {
  try {
    const { sales, summary, products } = await getInitialData();
    
    console.log('🎯 Rendering SalesManagement with:', {
      sales: sales?.length ?? 'undefined',
      summary: summary ? 'exists' : 'null',
      products: products?.length ?? 'undefined'
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        <SalesManagement
          initialSales={sales}
          initialSummary={summary}
          availableProducts={products}
        />
      </div>
    );
  } catch (error) {
    console.error('❌ Error in SalesPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Sales</h1>
          <p className="text-red-700 dark:text-red-300">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <a href="/admin/dashboard" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }
}
