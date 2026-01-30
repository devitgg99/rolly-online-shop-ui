import { fetchBrands } from '@/services/brands.service';
import { Brand, BrandListResponse } from '@/types/brand.types';
import BrandsManagement from '@/components/admin/BrandsManagement';

async function getBrand(): Promise<Brand[]> {
  const response: BrandListResponse = await fetchBrands();
  
  if (!response.success || !response.data) {
    return [];
  }
  
  return response.data;
}

export default async function BrandsPage() {
  const brands = await getBrand();
  return <BrandsManagement brands={brands} />;
}