import { fetchSales, fetchTodaySummary } from '@/services/sales.service';
import { fetchAdminProducts } from '@/services/products.service';
import { fetchCategories } from '@/services/categories.service';
import { SaleListItem, SaleListResponse, SaleSummary } from '@/types/sales.types';
import { AdminProduct } from '@/types/product.types';
import { Category } from '@/types/category.types';
import SalesManagement from '@/components/admin/SalesManagement';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.backendToken || '';

  const [salesRes, summaryRes, productsRes, categoriesRes] = await Promise.all([
    fetchSales(0, 20, token),
    fetchTodaySummary(token),
    fetchAdminProducts(0, 500, token),
    fetchCategories(),
  ]);

  const salesData: SaleListResponse | null = salesRes.success && salesRes.data ? salesRes.data : null;
  const sales: SaleListItem[] = salesData?.content ?? [];
  const summary: SaleSummary | null = summaryRes.success && summaryRes.data ? summaryRes.data : null;
  const products: AdminProduct[] = productsRes.success && productsRes.data?.content ? productsRes.data.content : [];
  const categories: Category[] = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];

  return { sales, salesData, summary, products, categories };
}

export default async function SalesPage() {
  try {
    const { sales, salesData, summary, products, categories } = await getInitialData();

    return (
      <SalesManagement
        initialSales={sales}
        initialSalesData={salesData}
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
          <h1 className="text-2xl font-bold text-red-600 mb-2">កំហុសក្នុងការផ្ទុកការលក់</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'មានកំហុសមិនរំពឹងទុក'}
          </p>
        </div>
      </div>
    );
  }
}
