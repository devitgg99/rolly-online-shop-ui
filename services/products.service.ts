import type { 
  AdminProductListApiResponse, 
  AdminProductDetailApiResponse,
  ProductListApiResponse,
  ProductDetailApiResponse,
  ProductRequest,
  InventoryStatsApiResponse
} from "@/types/product.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * Fetch admin products (with cost price and profit)
 */
export async function fetchAdminProducts(
  page: number = 0,
  size: number = 10,
  token: string,
  sortBy: string = "createdAt",
  direction: string = "desc"
): Promise<AdminProductListApiResponse> {
  try {
    const url = `${API_URL}/products/admin/all?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
    
    console.log('📡 Fetching admin products from:', url);
    console.log('🔑 Token present:', !!token);
    console.log('🔑 Token length:', token?.length || 0);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Failed to fetch admin products:', response.status, response.statusText);
      return {
        success: false,
        message: `Failed to fetch admin products: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    console.log('✅ Admin products fetched successfully:', result.data?.content?.length || 0, 'products');
    return result;
  } catch (error) {
    console.error("❌ Error fetching admin products:", error);
    return {
      success: false,
      message: "Network error while fetching admin products",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetch admin product detail (with cost price and profit)
 */
export async function fetchAdminProductDetail(
  id: string,
  token: string
): Promise<AdminProductDetailApiResponse> {
  try {
    const url = `${API_URL}/products/admin/${id}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch admin product detail: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching admin product detail:", error);
    return {
      success: false,
      message: "Network error while fetching admin product detail",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetch public products (paginated)
 */
export async function fetchProducts(
  page: number = 0,
  size: number = 10,
  sortBy: string = "createdAt",
  direction: string = "desc"
): Promise<ProductListApiResponse> {
  try {
    const url = `${API_URL}/products?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch products: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      message: "Network error while fetching products",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Fetch product detail
 */
export async function fetchProductDetail(id: string): Promise<ProductDetailApiResponse> {
  try {
    const url = `${API_URL}/products/${id}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch product detail: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return {
      success: false,
      message: "Network error while fetching product detail",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Create product (admin only)
 */
export async function createProductService(
  productData: ProductRequest,
  token: string
): Promise<AdminProductDetailApiResponse> {
  try {
    const url = `${API_URL}/products`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || `Failed to create product: ${response.statusText}`,
        data: undefined,
        error: errorData.error || errorData.message || `Failed to create product: ${response.statusText}`,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: "Network error while creating product",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Update product (admin only)
 */
export async function updateProductService(
  id: string,
  productData: ProductRequest,
  token: string
): Promise<AdminProductDetailApiResponse> {
  try {
    const url = `${API_URL}/products/${id}`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || `Failed to update product: ${response.statusText}`,
        data: undefined,
        error: errorData.error || errorData.message || `Failed to update product: ${response.statusText}`,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message: "Network error while updating product",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Delete product (admin only)
 */
export async function deleteProductService(
  id: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API_URL}/products/${id}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to delete product: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message: "Network error while deleting product",
    };
  }
}

/**
 * Search products
 */
export async function searchProducts(
  query: string,
  page: number = 0,
  size: number = 10
): Promise<ProductListApiResponse> {
  try {
    const url = `${API_URL}/products/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to search products: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error searching products:", error);
    return {
      success: false,
      message: "Network error while searching products",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Find product by barcode (Admin)
 */
export async function findProductByBarcode(
  barcode: string,
  token: string
): Promise<AdminProductDetailApiResponse> {
  try {
    const url = `${API_URL}/products/barcode/${encodeURIComponent(barcode)}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Product not found with barcode: ${barcode}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error finding product by barcode:", error);
    return {
      success: false,
      message: "Network error while finding product",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Filter products by brand
 */
export async function filterProductsByBrand(
  brandId: string,
  page: number = 0,
  size: number = 10
): Promise<ProductListApiResponse> {
  try {
    const url = `${API_URL}/products/brand/${brandId}?page=${page}&size=${size}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to filter products by brand: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error filtering products by brand:", error);
    return {
      success: false,
      message: "Network error while filtering products by brand",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Filter products by category
 */
export async function filterProductsByCategory(
  categoryId: string,
  page: number = 0,
  size: number = 10
): Promise<ProductListApiResponse> {
  try {
    const url = `${API_URL}/products/category/${categoryId}?page=${page}&size=${size}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to filter products by category: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error filtering products by category:", error);
    return {
      success: false,
      message: "Network error while filtering products by category",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get inventory statistics
 */
export async function fetchInventoryStats(
  token: string,
  lowStockThreshold: number = 10
): Promise<InventoryStatsApiResponse> {
  try {
    const url = `${API_URL}/products/admin/stats?lowStockThreshold=${lowStockThreshold}`;
    
    console.log('📊 [Service] Fetching inventory stats from:', url);
    console.log('🔑 [Service] Token present:', !!token);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log('📊 [Service] Stats response status:', response.status);

    if (!response.ok) {
      console.log('⚠️ [Service] Stats endpoint failed - backend may not have this endpoint yet');
      return {
        success: false,
        message: `Failed to fetch inventory stats: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return {
      success: false,
      message: "Network error while fetching inventory stats",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get low stock products
 */
export async function fetchLowStockProducts(
  token: string,
  threshold: number = 10,
  page: number = 0,
  size: number = 20
): Promise<AdminProductListApiResponse> {
  try {
    const url = `${API_URL}/products/admin/low-stock?threshold=${threshold}&page=${page}&size=${size}`;
    
    console.log('📦 [Service] Fetching low stock products from:', url);
    console.log('🔑 [Service] Token present:', !!token);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log('📦 [Service] Low stock response status:', response.status);

    if (!response.ok) {
      console.log('⚠️ [Service] Low stock endpoint failed - backend may not have this endpoint yet');
      return {
        success: false,
        message: `Failed to fetch low stock products: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return {
      success: false,
      message: "Network error while fetching low stock products",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}
