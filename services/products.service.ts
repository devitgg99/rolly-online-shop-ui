import type { 
  AdminProductListApiResponse, 
  AdminProductDetailApiResponse,
  ProductListApiResponse,
  ProductDetailApiResponse,
  ProductRequest,
  InventoryStatsApiResponse,
  InventoryTableApiResponse,
  ProductImagesApiResponse,
  ProductImageApiResponse,
  AddProductImageRequest,
  ReorderImagesRequest,
  StockHistoryApiResponse,
  StockAdjustmentRequest,
  StockAdjustmentApiResponse,
  ProductVariantsApiResponse,
  GroupedProductListApiResponse,
  CanDeleteApiResponse,
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
  direction: string = "desc",
  categoryId?: string,
  search?: string
): Promise<AdminProductListApiResponse> {
  try {
    // Build query params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('direction', direction);
    
    if (categoryId) {
      params.append('categoryId', categoryId);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const url = `${API_URL}/products/admin/all?${params.toString()}`;

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
        message: `Failed to fetch admin products: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    
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

/**
 * Get inventory table with full sales data
 */
export async function fetchInventoryTable(
  page: number = 0,
  size: number = 20,
  sortBy: string = "name",
  direction: string = "asc",
  token: string,
  categoryId?: string,
  search?: string
): Promise<InventoryTableApiResponse> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('direction', direction);
    
    if (categoryId) {
      params.append('categoryId', categoryId);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const url = `${API_URL}/products/admin/inventory?${params.toString()}`;

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
        message: `Failed to fetch inventory table: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching inventory table:", error);
    return {
      success: false,
      message: "Network error while fetching inventory table",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// MULTI-IMAGE SUPPORT
// ===================================

/**
 * Get all images for a product
 */
export async function fetchProductImages(
  productId: string,
  token: string
): Promise<ProductImagesApiResponse> {
  try {
    const url = `${API_URL}/products/${productId}/images`;
    
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
        message: `Failed to fetch product images: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching product images:", error);
    return {
      success: false,
      message: "Network error while fetching product images",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Add a new image to a product
 */
export async function addProductImage(
  productId: string,
  imageData: AddProductImageRequest,
  token: string
): Promise<ProductImageApiResponse> {
  try {
    const url = `${API_URL}/products/${productId}/images`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || `Failed to add product image: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error adding product image:", error);
    return {
      success: false,
      message: "Network error while adding product image",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Set an image as primary
 */
export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API_URL}/products/${productId}/images/${imageId}/set-primary`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to set primary image: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Primary image updated successfully",
    };
  } catch (error) {
    console.error("Error setting primary image:", error);
    return {
      success: false,
      message: "Network error while setting primary image",
    };
  }
}

/**
 * Reorder product images
 */
export async function reorderProductImages(
  productId: string,
  orderData: ReorderImagesRequest,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API_URL}/products/${productId}/images/reorder`;
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to reorder images: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Image order updated successfully",
    };
  } catch (error) {
    console.error("Error reordering images:", error);
    return {
      success: false,
      message: "Network error while reordering images",
    };
  }
}

/**
 * Delete a product image
 */
export async function deleteProductImage(
  productId: string,
  imageId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API_URL}/products/${productId}/images/${imageId}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || `Failed to delete image: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting product image:", error);
    return {
      success: false,
      message: "Network error while deleting image",
    };
  }
}

// ===================================
// STOCK HISTORY LOG
// ===================================

/**
 * Get stock change history for a product
 */
export async function fetchStockHistory(
  productId: string,
  page: number = 0,
  size: number = 20,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<StockHistoryApiResponse> {
  try {
    let url = `${API_URL}/products/${productId}/stock-history?page=${page}&size=${size}`;
    
    if (startDate) {
      url += `&startDate=${encodeURIComponent(startDate)}`;
    }
    if (endDate) {
      url += `&endDate=${encodeURIComponent(endDate)}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch stock history: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return {
      success: false,
      message: "Network error while fetching stock history",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Manually adjust stock (creates history entry)
 */
export async function adjustProductStock(
  productId: string,
  adjustmentData: StockAdjustmentRequest,
  token: string
): Promise<StockAdjustmentApiResponse> {
  try {
    const url = `${API_URL}/products/${productId}/stock-adjustment`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(adjustmentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || `Failed to adjust stock: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return {
      success: false,
      message: "Network error while adjusting stock",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// EXPORT TO EXCEL/CSV
// ===================================

/**
 * Export products to Excel or CSV
 */
export async function exportProducts(
  format: 'csv' | 'excel',
  token: string,
  filters?: {
    brandId?: string;
    categoryId?: string;
    lowStock?: boolean;
    search?: string;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  }
): Promise<{ success: boolean; message: string; blob?: Blob }> {
  try {
    let url = `${API_URL}/products/export?format=${format}`;
    
    if (filters) {
      if (filters.brandId) url += `&brandId=${filters.brandId}`;
      if (filters.categoryId) url += `&categoryId=${filters.categoryId}`;
      if (filters.lowStock) url += `&lowStock=true`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.sortBy) url += `&sortBy=${filters.sortBy}`;
      if (filters.direction) url += `&direction=${filters.direction}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to export products: ${response.statusText}`,
      };
    }

    const blob = await response.blob();
    
    // Get filename from Content-Disposition header or create default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `products-export-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Trigger download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      message: `Products exported successfully as ${format.toUpperCase()}`,
      blob,
    };
  } catch (error) {
    console.error("Error exporting products:", error);
    return {
      success: false,
      message: "Network error while exporting products",
    };
  }
}

// ===================================
// PRODUCT VARIANTS
// ===================================

/**
 * Get variants for a parent product
 */
export async function fetchProductVariants(
  parentId: string,
  token: string
): Promise<ProductVariantsApiResponse> {
  try {
    const url = `${API_URL}/products/${parentId}/variants`;

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
        message: `Failed to fetch variants: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return {
      success: false,
      message: "Network error while fetching variants",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get grouped products (parents + standalone, with variant info)
 */
export async function fetchGroupedProducts(
  page: number = 0,
  size: number = 20,
  token: string
): Promise<GroupedProductListApiResponse> {
  try {
    const url = `${API_URL}/products/admin/grouped?page=${page}&size=${size}`;

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
        message: `Failed to fetch grouped products: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching grouped products:", error);
    return {
      success: false,
      message: "Network error while fetching grouped products",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Check if a product can be safely deleted
 */
export async function checkCanDeleteProduct(
  productId: string,
  token: string
): Promise<CanDeleteApiResponse> {
  try {
    const url = `${API_URL}/products/admin/${productId}/can-delete`;

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
        message: `Failed to check delete status: ${response.statusText}`,
        data: undefined,
        createdAt: new Date().toISOString(),
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking can-delete:", error);
    return {
      success: false,
      message: "Network error while checking delete status",
      data: undefined,
      createdAt: new Date().toISOString(),
    };
  }
}
