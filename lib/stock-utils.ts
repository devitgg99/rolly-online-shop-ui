/**
 * Stock Level Utilities
 * Color-coding and helpers for stock management
 */

export type StockLevel = 'out' | 'critical' | 'low' | 'healthy';

export interface StockLevelInfo {
  level: StockLevel;
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
  icon: string;
  priority: number;
}

/**
 * Get stock level classification
 */
export function getStockLevel(quantity: number): StockLevel {
  if (quantity === 0) return 'out';
  if (quantity <= 3) return 'critical';
  if (quantity <= 10) return 'low';
  return 'healthy';
}

/**
 * Get stock level styling and info
 */
export function getStockLevelInfo(quantity: number): StockLevelInfo {
  const level = getStockLevel(quantity);
  
  const infoMap: Record<StockLevel, StockLevelInfo> = {
    out: {
      level: 'out',
      color: 'rgb(239, 68, 68)', // red-500
      bgColor: 'rgb(254, 226, 226)', // red-100
      textColor: 'rgb(127, 29, 29)', // red-900
      label: 'Out of Stock',
      icon: '🔴',
      priority: 4
    },
    critical: {
      level: 'critical',
      color: 'rgb(249, 115, 22)', // orange-500
      bgColor: 'rgb(255, 237, 213)', // orange-100
      textColor: 'rgb(124, 45, 18)', // orange-900
      label: 'Critical',
      icon: '🟠',
      priority: 3
    },
    low: {
      level: 'low',
      color: 'rgb(234, 179, 8)', // yellow-500
      bgColor: 'rgb(254, 249, 195)', // yellow-100
      textColor: 'rgb(113, 63, 18)', // yellow-900
      label: 'Low Stock',
      icon: '🟡',
      priority: 2
    },
    healthy: {
      level: 'healthy',
      color: 'rgb(34, 197, 94)', // green-500
      bgColor: 'rgb(220, 252, 231)', // green-100
      textColor: 'rgb(20, 83, 45)', // green-900
      label: 'Healthy',
      icon: '🟢',
      priority: 1
    }
  };
  
  return infoMap[level];
}

/**
 * Get Tailwind CSS classes for stock badge
 */
export function getStockBadgeClasses(quantity: number): string {
  const level = getStockLevel(quantity);
  
  const classMap: Record<StockLevel, string> = {
    out: 'bg-red-100 text-red-900 border-red-300',
    critical: 'bg-orange-100 text-orange-900 border-orange-300',
    low: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    healthy: 'bg-green-100 text-green-900 border-green-300'
  };
  
  return classMap[level];
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(costPrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate stock value
 */
export function calculateStockValue(quantity: number, costPrice: number): number {
  return quantity * costPrice;
}

/**
 * Calculate potential profit
 */
export function calculatePotentialProfit(quantity: number, profitPerUnit: number): number {
  return quantity * profitPerUnit;
}

/**
 * Get reorder recommendation
 */
export function getReorderRecommendation(
  currentStock: number,
  avgDailySales: number = 1,
  leadTimeDays: number = 7
): {
  shouldReorder: boolean;
  urgency: 'immediate' | 'soon' | 'normal' | 'none';
  daysUntilStockout: number;
  recommendedOrderQty: number;
} {
  const daysUntilStockout = avgDailySales > 0 ? currentStock / avgDailySales : 999;
  const recommendedOrderQty = Math.ceil(avgDailySales * (leadTimeDays + 7)); // Lead time + 1 week buffer
  
  let urgency: 'immediate' | 'soon' | 'normal' | 'none' = 'none';
  let shouldReorder = false;
  
  if (daysUntilStockout <= 3) {
    urgency = 'immediate';
    shouldReorder = true;
  } else if (daysUntilStockout <= 7) {
    urgency = 'soon';
    shouldReorder = true;
  } else if (daysUntilStockout <= 14) {
    urgency = 'normal';
    shouldReorder = true;
  }
  
  return {
    shouldReorder,
    urgency,
    daysUntilStockout: Math.floor(daysUntilStockout),
    recommendedOrderQty
  };
}

/**
 * Smart filter presets
 */
export type SmartFilterPreset = {
  id: string;
  label: string;
  icon: string;
  description: string;
  filter: (product: any) => boolean;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

export const SMART_FILTER_PRESETS: SmartFilterPreset[] = [
  {
    id: 'out-of-stock',
    label: 'Out of Stock',
    icon: '🔴',
    description: 'Products with 0 stock',
    filter: (p) => p.stockQuantity === 0,
    badgeVariant: 'destructive'
  },
  {
    id: 'critical-stock',
    label: 'Critical Stock',
    icon: '🟠',
    description: 'Products with 1-3 units',
    filter: (p) => p.stockQuantity > 0 && p.stockQuantity <= 3,
    badgeVariant: 'destructive'
  },
  {
    id: 'low-stock',
    label: 'Low Stock',
    icon: '🟡',
    description: 'Products with 4-10 units',
    filter: (p) => p.stockQuantity > 3 && p.stockQuantity <= 10,
    badgeVariant: 'secondary'
  },
  {
    id: 'healthy-stock',
    label: 'Healthy Stock',
    icon: '🟢',
    description: 'Products with >10 units',
    filter: (p) => p.stockQuantity > 10,
    badgeVariant: 'outline'
  },
  {
    id: 'low-profit',
    label: 'Low Profit',
    icon: '📉',
    description: 'Profit per unit < $0.50',
    filter: (p) => {
      const profit = p.discountedPrice - p.costPrice;
      return profit < 0.5;
    },
    badgeVariant: 'secondary'
  },
  {
    id: 'high-value',
    label: 'High Value',
    icon: '💎',
    description: 'Cost price > $10',
    filter: (p) => p.costPrice > 10,
    badgeVariant: 'default'
  },
  {
    id: 'never-sold',
    label: 'Never Sold',
    icon: '😴',
    description: 'Products with 0 sales',
    filter: (p) => p.totalSold === 0,
    badgeVariant: 'secondary'
  },
  {
    id: 'best-sellers',
    label: 'Best Sellers',
    icon: '🔥',
    description: 'Products with >10 sales',
    filter: (p) => p.totalSold > 10,
    badgeVariant: 'default'
  }
];

/**
 * Get active smart filters
 */
export function getActiveSmartFilters(products: any[], presetId: string): any[] {
  const preset = SMART_FILTER_PRESETS.find(p => p.id === presetId);
  if (!preset) return products;
  return products.filter(preset.filter);
}
