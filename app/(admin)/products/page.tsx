import { fetchAdminProducts } from '@/services/products.service';
import { fetchBrands } from '@/services/brands.service';
import { fetchCategories } from '@/services/categories.service';
import { AdminProduct } from '@/types/product.types';
import { Brand } from '@/types/brand.types';
import { Category } from '@/types/category.types';
import ProductsManagement from '@/components/admin/ProductsManagement';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Force dynamic rendering (required for authentication)
export const dynamic = 'force-dynamic';

async function getInitialData() {
  const session = await getServerSession(authOptions);
  
  console.log('🔍 [Products Page] Session exists:', !!session);
  console.log('🔍 [Products Page] Session user:', (session as any)?.user?.email);
  console.log('🔍 [Products Page] Backend token exists:', !!(session as any)?.backendToken);
  console.log('🔍 [Products Page] Token length:', (session as any)?.backendToken?.length || 0);
  
  const token = (session as any)?.backendToken || '';

  if (!token) {
    console.error('❌ [Products Page] No backend token found in session!');
    console.error('❌ [Products Page] Please log out and log back in to refresh your session');
    return { products: [], brands: [], categories: [] };
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

  const [productsRes, brandsRes, categoriesRes] = await Promise.all([
    fetchAdminProducts(0, 20, token),
    fetchBrands(),
    fetchCategories(),
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

  return { products, brands, categories };
}

export default async function ProductsPage() {
  try {
    const { products, brands, categories } = await getInitialData();
    
    return (
      <ProductsManagement
        initialProducts={products}
        brands={brands}
        categories={categories}
      />
    );
  } catch (error) {
    console.error('❌ [Products Page] Fatal error:', error);
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
