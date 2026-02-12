'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  createSaleService, 
  fetchSaleDetail, 
  fetchTodaySummary, 
  fetchSummaryByDateRange,
  fetchTodaySales,
  fetchSales,
  fetchSalesByDateRange,
  fetchProductSalesStats,
  fetchTopSellingProducts,
  fetchTopSellingProductsByRange,
  fetchSalesWithFilters,
  fetchSalesAnalytics,
  createRefund,
} from "@/services/sales.service";
import { 
  SaleRequest, 
  SaleApiResponse, 
  SaleSummaryApiResponse,
  SaleListApiResponse,
  ProductSalesStatsApiResponse,
  TopSellingProductsApiResponse,
  SalesAnalyticsApiResponse,
  RefundRequest,
  RefundApiResponse,
} from "@/types/sales.types";
import { logger } from "@/lib/logger";

export async function createSaleAction(saleData: SaleRequest): Promise<SaleApiResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await createSaleService(saleData, token);
    return response;
  } catch (error) {
    logger.error("createSaleAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create sale",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchSaleDetailAction(saleId: string): Promise<SaleApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchSaleDetail(saleId, token);
    
    return response;
  } catch (error) {
    logger.error("fetchSaleDetailAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch sale details",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchTodaysSummaryAction(): Promise<SaleSummaryApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchTodaySummary(token);
    
    return response;
  } catch (error) {
    logger.error("fetchTodaysSummaryAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch today's summary",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchSummaryByDateRangeAction(
  startDate?: string,
  endDate?: string
): Promise<SaleSummaryApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchSummaryByDateRange(startDate, endDate, token);
    
    return response;
  } catch (error) {
    logger.error("fetchSummaryByDateRangeAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch summary by date range",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchTodaysSalesAction(): Promise<SaleListApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchTodaySales(token);
    
    return response;
  } catch (error) {
    logger.error("fetchTodaysSalesAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch today's sales",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchAllSalesAction(page: number = 0, size: number = 100): Promise<SaleListApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchSales(page, size, token);
    
    return response;
  } catch (error) {
    logger.error("fetchAllSalesAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch all sales",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchSalesByDateRangeAction(
  startDate: string,
  endDate: string
): Promise<SaleListApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchSalesByDateRange(startDate, endDate, token);
    
    return response;
  } catch (error) {
    logger.error("fetchSalesByDateRangeAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch sales by date range",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchProductSalesStatsAction(productId: string): Promise<ProductSalesStatsApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchProductSalesStats(productId, token);
    
    return response;
  } catch (error) {
    logger.error("fetchProductSalesStatsAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch product sales stats",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchTopSellingProductsAction(limit: number = 10): Promise<TopSellingProductsApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchTopSellingProducts(limit, token);
    
    return response;
  } catch (error) {
    logger.error("fetchTopSellingProductsAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch top selling products",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function fetchTopSellingProductsByRangeAction(
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopSellingProductsApiResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    const response = await fetchTopSellingProductsByRange(startDate, endDate, limit, token);
    
    return response;
  } catch (error) {
    logger.error("fetchTopSellingProductsByRangeAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch top selling products by range",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// ADVANCED FILTERS (server-side proxy)
// ===================================

export async function fetchSalesWithFiltersAction(
  filters: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD' | 'ONLINE';
    minAmount?: number;
    maxAmount?: number;
    customerName?: string;
    productId?: string;
    sortBy?: 'date' | 'amount' | 'profit';
    direction?: 'asc' | 'desc';
    page?: number;
    size?: number;
  }
): Promise<SaleListApiResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    return await fetchSalesWithFilters(filters, token);
  } catch (error) {
    logger.error("fetchSalesWithFiltersAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch sales",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// ANALYTICS (server-side proxy)
// ===================================

export async function fetchSalesAnalyticsAction(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<SalesAnalyticsApiResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    return await fetchSalesAnalytics(startDate, endDate, groupBy, token);
  } catch (error) {
    logger.error("fetchSalesAnalyticsAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch analytics",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// REFUND (server-side proxy)
// ===================================

export async function createRefundAction(
  saleId: string,
  refundData: RefundRequest
): Promise<RefundApiResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).backendToken) {
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    return await createRefund(saleId, refundData, token);
  } catch (error) {
    logger.error("createRefundAction error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create refund",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}
