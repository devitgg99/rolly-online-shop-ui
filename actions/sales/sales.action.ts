'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  createSaleService, 
  fetchSaleDetail, 
  fetchTodaySummary, 
  fetchSummaryByDateRange,
  fetchTodaySales 
} from "@/services/sales.service";
import { 
  SaleRequest, 
  SaleApiResponse, 
  SaleSummaryApiResponse,
  SaleListApiResponse 
} from "@/types/sales.types";
import { logger } from "@/lib/logger";
import { sanitizeError } from "@/lib/security";

export async function createSaleAction(saleData: SaleRequest): Promise<SaleApiResponse> {
  try {
    console.log('🔍 [Action] Creating sale, data:', JSON.stringify(saleData, null, 2));
    
    const session = await getServerSession(authOptions);
    
    console.log('🔍 [Action] Session exists:', !!session);
    console.log('🔍 [Action] Token exists:', !!(session as any)?.backendToken);
    
    if (!session || !(session as any).backendToken) {
      console.error('❌ [Action] Unauthorized - No session or token');
      return {
        success: false,
        message: "Unauthorized - Please login",
        data: null,
        createdAt: new Date().toISOString(),
      };
    }

    const token = (session as any).backendToken;
    console.log('🔍 [Action] Token length:', token?.length);
    
    const response = await createSaleService(saleData, token);
    
    console.log('📦 [Action] Service response:', response.success, response.message);
    
    return response;
  } catch (error) {
    console.error('❌ [Action] Error:', error);
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
  startDate: string,
  endDate: string
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
