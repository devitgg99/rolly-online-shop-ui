import { Brand, BrandListResponse, BrandRequest } from "@/types/brand.types";
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