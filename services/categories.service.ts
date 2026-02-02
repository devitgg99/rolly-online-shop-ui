import { Category, CategoryListResponse, CategoryRequest } from "@/types/category.types";
import { ApiResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<CategoryListResponse> {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to fetch categories",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch only root categories (categories without parent)
 */
export async function fetchRootCategories(): Promise<CategoryListResponse> {
  try {
    const response = await fetch(`${API_URL}/categories/root`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to fetch root categories",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch subcategories of a specific category
 */
export async function fetchSubcategories(parentId: string): Promise<CategoryListResponse> {
  try {
    const response = await fetch(`${API_URL}/categories/${parentId}/subcategories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to fetch subcategories",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createCategoryService(
  categoryData: CategoryRequest,
  token: string
): Promise<ApiResponse<Category>> {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to create category",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateCategoryService(
  id: string,
  categoryData: CategoryRequest,
  token: string
): Promise<ApiResponse<Category>> {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to update category",
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteCategoryService(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to delete category",
        error: `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      message: "Category deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Network error or server unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
