import type {
  SaleRequest,
  SaleApiResponse,
  SaleListApiResponse,
  SaleSummaryApiResponse,
  ProductSalesStatsApiResponse,
  TopSellingProductsApiResponse,
  SalesAnalyticsApiResponse,
  RefundRequest,
  RefundApiResponse,
  RefundListApiResponse,
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

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Failed to create sale: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
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
        message: `Failed to fetch sales: ${response.status} ${response.statusText}`,
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
      message: error instanceof Error ? error.message : "Network error while fetching sales",
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
        message: `Failed to fetch today's summary: ${response.status} ${response.statusText}`,
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
      message: error instanceof Error ? error.message : "Network error while fetching today's summary",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get sales summary by date range (omit dates for all-time)
 */
export async function fetchSummaryByDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  token: string
): Promise<SaleSummaryApiResponse> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    const url = `${API_URL}/sales/summary${qs ? `?${qs}` : ''}`;

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

// ===================================
// SALES ANALYTICS
// ===================================

/**
 * Get sales analytics with various metrics
 */
export async function fetchSalesAnalytics(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day',
  token: string
): Promise<SalesAnalyticsApiResponse> {
  try {
    const url = `${API_URL}/sales/analytics?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&groupBy=${groupBy}`;

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
        message: `Failed to fetch sales analytics: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    return {
      success: false,
      message: "Network error while fetching sales analytics",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get sales with advanced filtering
 */
export async function fetchSalesWithFilters(
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
  },
  token: string
): Promise<SaleListApiResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.customerName) params.append('customerName', filters.customerName);
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.direction) params.append('direction', filters.direction);
    params.append('page', (filters.page || 0).toString());
    params.append('size', (filters.size || 20).toString());

    const url = `${API_URL}/sales?${params.toString()}`;

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
    console.error("Error fetching sales with filters:", error);
    return {
      success: false,
      message: "Network error while fetching sales",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// REFUND & RETURN MANAGEMENT
// ===================================

/**
 * Create a refund for a sale
 */
export async function createRefund(
  saleId: string,
  refundData: RefundRequest,
  token: string
): Promise<RefundApiResponse> {
  try {
    const url = `${API_URL}/sales/${saleId}/refund`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(refundData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || `Failed to create refund: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating refund:", error);
    return {
      success: false,
      message: "Network error while creating refund",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get all refunds (paginated)
 */
export async function fetchRefunds(
  page: number = 0,
  size: number = 20,
  token: string
): Promise<RefundListApiResponse> {
  try {
    const url = `${API_URL}/sales/refunds?page=${page}&size=${size}`;

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
        message: `Failed to fetch refunds: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return {
      success: false,
      message: "Network error while fetching refunds",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Get refunds for a specific sale
 */
export async function fetchSaleRefunds(
  saleId: string,
  token: string
): Promise<RefundListApiResponse> {
  try {
    const url = `${API_URL}/sales/${saleId}/refunds`;

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
        message: `Failed to fetch sale refunds: ${response.statusText}`,
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sale refunds:", error);
    return {
      success: false,
      message: "Network error while fetching sale refunds",
      data: null,
      createdAt: new Date().toISOString(),
    };
  }
}

// ===================================
// EXPORT & REPORTING
// ===================================

/**
 * Export sales to Excel, CSV, or PDF
 */
export async function exportSales(
  format: 'csv' | 'excel' | 'pdf',
  token: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    includeItems?: boolean;
  }
): Promise<{ success: boolean; message: string; blob?: Blob }> {
  try {
    let url = `${API_URL}/sales/export?format=${format}`;
    
    if (filters) {
      if (filters.startDate) url += `&startDate=${encodeURIComponent(filters.startDate)}`;
      if (filters.endDate) url += `&endDate=${encodeURIComponent(filters.endDate)}`;
      if (filters.paymentMethod) url += `&paymentMethod=${filters.paymentMethod}`;
      if (filters.includeItems !== undefined) url += `&includeItems=${filters.includeItems}`;
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
        message: `Failed to export sales: ${response.statusText}`,
      };
    }

    const blob = await response.blob();
    
    // Get filename from Content-Disposition header or create default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `sales-export-${new Date().toISOString().split('T')[0]}.${format}`;
    
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
      message: `Sales exported successfully as ${format.toUpperCase()}`,
      blob,
    };
  } catch (error) {
    console.error("Error exporting sales:", error);
    return {
      success: false,
      message: "Network error while exporting sales",
    };
  }
}

/**
 * Email receipt to customer
 */
export async function emailReceipt(
  saleId: string,
  email: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API_URL}/sales/${saleId}/email-receipt`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to email receipt: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Receipt sent successfully!",
    };
  } catch (error) {
    console.error("Error emailing receipt:", error);
    return {
      success: false,
      message: "Network error while sending receipt",
    };
  }
}

/**
 * Resend receipt
 */
export async function resendReceipt(
  saleId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API_URL}/sales/${saleId}/resend-receipt`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to resend receipt: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Receipt resent successfully!",
    };
  } catch (error) {
    console.error("Error resending receipt:", error);
    return {
      success: false,
      message: "Network error while resending receipt",
    };
  }
}

/**
 * Get receipt PDF
 */
export async function getReceiptPdf(
  saleId: string,
  token: string
): Promise<{ success: boolean; message: string; blob?: Blob }> {
  try {
    const url = `${API_URL}/sales/${saleId}/receipt-pdf`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to get receipt PDF: ${response.statusText}`,
      };
    }

    const blob = await response.blob();
    
    // Trigger download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `receipt-${saleId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      message: "Receipt PDF downloaded successfully!",
      blob,
    };
  } catch (error) {
    console.error("Error getting receipt PDF:", error);
    return {
      success: false,
      message: "Network error while getting receipt PDF",
    };
  }
}
