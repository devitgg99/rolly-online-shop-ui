import { fetchCategories } from '@/services/categories.service';
import { Category, CategoryListResponse } from '@/types/category.types';
import CategoriesManagement from '@/components/admin/CategoriesManagement';

// Force dynamic rendering (required for cache: 'no-store')
export const dynamic = 'force-dynamic';

async function getCategories(): Promise<Category[]> {
  const response: CategoryListResponse = await fetchCategories();
  
  if (!response.success || !response.data) {
    return [];
  }
  
  return response.data;
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesManagement categories={categories} />;
}
