import { fetchAdminProducts } from '@/services/products.service';
import { fetchCategories } from '@/services/categories.service';
import { AdminProduct } from '@/types/product.types';
import { Category } from '@/types/category.types';
import POSTerminal from '@/components/admin/POSTerminal';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

async function getPOSData() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.backendToken || '';

  const [productsRes, categoriesRes] = await Promise.all([
    fetchAdminProducts(0, 500, token),
    fetchCategories(),
  ]);

  const products: AdminProduct[] = productsRes.success && productsRes.data?.content
    ? productsRes.data.content
    : [];
  const categories: Category[] = categoriesRes.success && categoriesRes.data
    ? categoriesRes.data
    : [];

  return { products, categories };
}

export default async function POSPage() {
  try {
    const { products, categories } = await getPOSData();

    return <POSTerminal products={products} categories={categories} />;
  } catch (error) {
    console.error('Error loading POS:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">កំហុសក្នុងការផ្ទុក POS</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'មានកំហុសមិនរំពឹងទុក'}
          </p>
        </div>
      </div>
    );
  }
}
