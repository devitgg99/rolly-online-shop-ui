import { 
  Brand, 
  BrandListResponse, 
  BrandRequest, 
  BrandAnalytics, 
  BrandAnalyticsResponse,
  BrandStats,
  BrandStatsResponse 
} from "@/types/brand.types";
import { ApiResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchBrands(): Promise<BrandListResponse> {
  try {
    const response = await fetch(`${API_URL}/brands`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch brands:", response.status); 
      return {
        success: false,
        message: "Failed to fetch brands",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ getBrands error:", error);
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createBrandService(
  brandData: BrandRequest,
  token: string
): Promise<ApiResponse<Brand>> {
  try {
    const response = await fetch(`${API_URL}/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      console.error("❌ Failed to create brand:", response.status);
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to create brand",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ createBrand error:", error);
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateBrandService(
  id: string,
  brandData: BrandRequest,
  token: string
): Promise<ApiResponse<Brand>> {
  try {
    const response = await fetch(`${API_URL}/brands/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      console.error("❌ Failed to update brand:", response.status);
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to update brand",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ updateBrand error:", error);
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteBrandService(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_URL}/brands/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("❌ Failed to delete brand:", response.status);
      return {
        success: false,
        message: "Failed to delete brand",
        error: `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      message: "Brand deleted successfully",
    };
  } catch (error) {
    console.error("❌ deleteBrand error:", error);
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch brand analytics (product count, inventory value per brand)
 * 
 * API Spec:
 * GET /api/v1/brands/analytics
 * 
 * Response:
 * {
 *   success: true,
 *   data: [
 *     {
 *       brandId: string,
 *       brandName: string,
 *       productCount: number,
 *       totalInventoryValue: number,
 *       totalPotentialProfit: number,
 *       avgProductPrice: number
 *     }
 *   ]
 * }
 */
export async function fetchBrandAnalytics(token: string): Promise<BrandAnalyticsResponse> {
  try {
    const response = await fetch(`${API_URL}/brands/analytics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch brand analytics:", response.status);
      return {
        success: false,
        message: "Failed to fetch brand analytics",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ fetchBrandAnalytics error:", error);
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch brand statistics summary
 * 
 * API Spec:
 * GET /api/v1/brands/stats
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     totalBrands: number,
 *     brandsWithProducts: number,
 *     brandsWithoutProducts: number,
 *     totalProducts: number,
 *     totalInventoryValue: number
 *   }
 * }
 */
export async function fetchBrandStats(token: string): Promise<BrandStatsResponse> {
  try {
    const response = await fetch(`${API_URL}/brands/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch brand stats:", response.status);
      return {
        success: false,
        message: "Failed to fetch brand stats",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ fetchBrandStats error:", error);
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export brands to CSV/Excel
 * 
 * API Spec:
 * GET /api/v1/brands/export?format=csv|excel
 * 
 * Response: File download (CSV or Excel)
 */
export async function exportBrands(
  format: 'csv' | 'excel',
  token: string
): Promise<Blob | null> {
  try {
    const response = await fetch(`${API_URL}/brands/export?format=${format}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("❌ Failed to export brands:", response.status);
      return null;
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("❌ exportBrands error:", error);
    return null;
  }
}