import type { ApiResponse } from "@/types/api.types";
import type { ProductListResponse, ProductRequest } from "@/types/product.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Get paginated products list
 */
export async function getProducts(
  page: number = 0,
  size: number = 10,
  brandId?: string,
  categoryId?: string,
  search?: string
): Promise<ApiResponse<ProductListResponse>> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (brandId) params.append('brandId', brandId);
    if (categoryId) params.append('categoryId', categoryId);
    if (search) params.append('search', search);

    console.log("📤 Get Products Request:", { page, size, brandId, categoryId, search });

    const response = await fetch(`${API_URL}/api/products?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📥 Get Products Response:", response.status);

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Get products error:", error);
    return {
      success: false,
      error: "Failed to fetch products",
      message: "Network error or server unavailable"
    };
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  productData: ProductRequest
): Promise<Response> {
  console.log("📤 Create Product Request:", productData);

  try {
    const response = await fetch(`${API_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header when authenticated
        // Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    console.log("📥 Create Product Response:", response.status);
    return response;
  } catch (error) {
    console.error("❌ Create product error:", error);
    return new Response(
      JSON.stringify({ error: "Network error or server unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  productData: ProductRequest
): Promise<Response> {
  console.log("📤 Update Product Request:", { id, ...productData });

  try {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    console.log("📥 Update Product Response:", response.status);
    return response;
  } catch (error) {
    console.error("❌ Update product error:", error);
    return new Response(
      JSON.stringify({ error: "Network error or server unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<Response> {
  console.log("📤 Delete Product Request:", id);

  try {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📥 Delete Product Response:", response.status);
    return response;
  } catch (error) {
    console.error("❌ Delete product error:", error);
    return new Response(
      JSON.stringify({ error: "Network error or server unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
