import type {
  SaleRequest,
  SaleApiResponse,
  SaleListApiResponse,
  SaleSummaryApiResponse,
  ProductSalesStatsApiResponse,
  TopSellingProductsApiResponse,
} from "@/types/sales.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Create a new sale
 */
export async function createSaleService(
  saleData: SaleRequest,
  token: string
): Promise<SaleApiResponse> {
  try {
    const url = `${API_URL}/sales`;

    console.log('🔍 [Service] Creating sale');
    console.log('🔍 [Service] URL:', url);
    console.log('🔍 [Service] Token length:', token?.length);
    console.log('🔍 [Service] Request body:', JSON.stringify(saleData, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });

    console.log('📦 [Service] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [Service] Error response:', errorData);
      return {
        success: false,
        message: errorData.message || `Failed to create sale: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    console.log('✅ [Service] Success:', result.success);
    return result;
  } catch (error) {
    console.error("❌ [Service] Network error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error while creating sale",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get all sales (paginated)
 */
export async function fetchSales(
  page: number = 0,
  size: number = 10,
  token: string
): Promise<SaleListApiResponse> {
  try {
    const url = `${API_URL}/sales?page=${page}&size=${size}`;

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
        message: `Failed to fetch sales: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sales:", error);
    return {
      success: false,
      message: "Network error while fetching sales",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get sale details by ID
 */
export async function fetchSaleDetail(
  id: string,
  token: string
): Promise<SaleApiResponse> {
  try {
    const url = `${API_URL}/sales/${id}`;

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
        message: `Failed to fetch sale detail: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sale detail:", error);
    return {
      success: false,
      message: "Network error while fetching sale detail",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get today's sales
 */
export async function fetchTodaySales(token: string): Promise<SaleListApiResponse> {
  try {
    const url = `${API_URL}/sales/today`;

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
        message: `Failed to fetch today's sales: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching today's sales:", error);
    return {
      success: false,
      message: "Network error while fetching today's sales",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get sales by date range
 */
export async function fetchSalesByDateRange(
  startDate: string,
  endDate: string,
  token: string
): Promise<SaleListApiResponse> {
  try {
    const url = `${API_URL}/sales/range?startDate=${startDate}&endDate=${endDate}`;

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
        message: `Failed to fetch sales by date range: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sales by date range:", error);
    return {
      success: false,
      message: "Network error while fetching sales by date range",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get today's sales summary
 */
export async function fetchTodaySummary(token: string): Promise<SaleSummaryApiResponse> {
  try {
    const url = `${API_URL}/sales/summary/today`;

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
        message: `Failed to fetch today's summary: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching today's summary:", error);
    return {
      success: false,
      message: "Network error while fetching today's summary",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get sales summary by date range
 */
export async function fetchSummaryByDateRange(
  startDate: string,
  endDate: string,
  token: string
): Promise<SaleSummaryApiResponse> {
  try {
    const url = `${API_URL}/sales/summary?startDate=${startDate}&endDate=${endDate}`;

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
        message: `Failed to fetch summary by date range: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching summary by date range:", error);
    return {
      success: false,
      message: "Network error while fetching summary by date range",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get product sales statistics
 * NOTE: This endpoint may not be available on backend yet
 */
export async function fetchProductSalesStats(
  productId: string,
  token: string
): Promise<ProductSalesStatsApiResponse> {
  try {
    const url = `${API_URL}/sales/product/${productId}/stats`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`⚠️ Product stats endpoint not available: ${response.status}`);
      return {
        success: false,
        message: `Product stats endpoint not available (${response.status})`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching product sales stats:", error);
    return {
      success: false,
      message: "Network error while fetching product sales stats",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get top selling products (all time)
 */
export async function fetchTopSellingProducts(
  limit: number = 10,
  token: string
): Promise<TopSellingProductsApiResponse> {
  try {
    const url = `${API_URL}/sales/top-selling?limit=${limit}`;

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
        message: `Failed to fetch top selling products: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return {
      success: false,
      message: "Network error while fetching top selling products",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get top selling products by date range
 */
export async function fetchTopSellingProductsByRange(
  startDate: string,
  endDate: string,
  limit: number = 10,
  token: string
): Promise<TopSellingProductsApiResponse> {
  try {
    const url = `${API_URL}/sales/top-selling/range?startDate=${startDate}&endDate=${endDate}&limit=${limit}`;

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
        message: `Failed to fetch top selling products by range: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching top selling products by range:", error);
    return {
      success: false,
      message: "Network error while fetching top selling products by range",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}
