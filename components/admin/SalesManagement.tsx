'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ShoppingCart, 
  Plus, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Eye, 
  Search, 
  Minus, 
  X, 
  Scan, 
  Camera,
  Download,
  Undo2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';

import type { Sale, SaleListItem, SaleListResponse, SaleSummary, SaleRequest, SaleItem } from '@/types/sales.types';
import type { AdminProduct } from '@/types/product.types';
import type { Category } from '@/types/category.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { 
  createSaleAction, 
  fetchSaleDetailAction, 
  fetchSummaryByDateRangeAction,
  fetchSalesWithFiltersAction,
  fetchTopSellingProductsAction,
  fetchTopSellingProductsByRangeAction,
} from '@/actions/sales/sales.action';
import { findProductByBarcodeAction } from '@/actions/products/barcode.action';
import BarcodeScanner from './BarcodeScanner';
import ReceiptDialog from './ReceiptDialog';
import { SalesAnalyticsDashboard } from './SalesAnalyticsDashboard';
import { RefundDialog } from './RefundDialog';
import { exportSales } from '@/services/sales.service';
import { formatUSD, formatKHR } from '@/lib/currency';
import type { TopSellingProduct } from '@/types/sales.types';

interface SalesManagementProps {
  initialSales: SaleListItem[];
  initialSalesData?: SaleListResponse | null;
  initialSummary: SaleSummary | null;
  availableProducts?: AdminProduct[];
  categories?: Category[];
}

interface CartItem extends SaleItem {
  product: AdminProduct;
  subtotal: number;
}

interface SaleFormData {
  customerName: string;
  customerPhone: string;
  discountAmount: string;
  paymentMethod: 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD';
  notes: string;
}

// Payment method display helper
const getPaymentMethodDisplay = (method: string): { label: string; icon: string; color: string } => {
  const displays: Record<string, { label: string; icon: string; color: string }> = {
    'CASH': { label: 'Cash', icon: '💵', color: 'bg-green-100 text-green-700 border-green-300' },
    'CARD': { label: 'Card', icon: '💳', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    'E_WALLET': { label: 'E-Wallet', icon: '📱', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    'BANK_TRANSFER': { label: 'Bank Transfer', icon: '🏦', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    'COD': { label: 'Cash on Delivery', icon: '📦', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    'ONLINE': { label: 'Online', icon: '🌐', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' }, // Legacy support
  };
  return displays[method] || { label: method, icon: '💰', color: 'bg-gray-100 text-gray-700 border-gray-300' };
};

export default function SalesManagement({ initialSales, initialSalesData, initialSummary, availableProducts, categories }: SalesManagementProps) {
  const { data: session } = useSession();
  
  const [sales, setSales] = useState<SaleListItem[]>(initialSales || []);
  const [summary, setSummary] = useState<SaleSummary | null>(initialSummary);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; sale: Sale | null }>({
    open: false,
    sale: null,
  });
  const [receiptDialog, setReceiptDialog] = useState<{ open: boolean; sale: Sale | null }>({
    open: false,
    sale: null,
  });
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; sale: Sale | null }>({
    open: false,
    sale: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState<SaleFormData>({
    customerName: '',
    customerPhone: '',
    discountAmount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  // Unified date period filter
  type Period = 'today' | 'yesterday' | 'week' | 'month' | 'all';
  const [activePeriod, setActivePeriod] = useState<Period>('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [topSelling, setTopSelling] = useState<TopSellingProduct[]>([]);
  const [isLoadingTop, setIsLoadingTop] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(initialSalesData?.page ?? 0);
  const [totalPages, setTotalPages] = useState(initialSalesData?.totalPages ?? 0);
  const [totalElements, setTotalElements] = useState(initialSalesData?.totalElements ?? 0);
  const pageSize = 20;

  // Compute start/end dates from period
  const getDateRange = (period: Period): { startDate?: string; endDate?: string } => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        return { startDate: fmt(today), endDate: fmt(today) };
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { startDate: fmt(y), endDate: fmt(y) };
      }
      case 'week': {
        const w = new Date(today);
        w.setDate(w.getDate() - 7);
        return { startDate: fmt(w), endDate: fmt(today) };
      }
      case 'month': {
        const m = new Date(today);
        m.setDate(m.getDate() - 30);
        return { startDate: fmt(m), endDate: fmt(today) };
      }
      case 'all':
        return {};
    }
  };

  const periodLabels: Record<Period, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  };

  // Barcode scanner states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeBufferRef = useRef(''); // Use ref instead of state to avoid re-renders
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isProcessingRef = useRef(false); // Prevent concurrent scans
  const isCameraScanningRef = useRef(false); // Prevent camera dialog from reopening
  const lastScannedBarcodeRef = useRef(''); // Track last scanned barcode
  const lastScanTimeRef = useRef(0); // Track last scan time

  // Clear barcode cache when dialog opens/closes
  useEffect(() => {
    clearBarcodeCache();
  }, [dialogOpen]);

  // Clear all barcode cache data
  const clearBarcodeCache = () => {
    barcodeBufferRef.current = '';
    setScannedBarcode('');
    setBarcodeInput('');
    isProcessingRef.current = false;
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
      barcodeTimeoutRef.current = undefined;
    }
  };

  // Keyboard barcode scanner listener
  useEffect(() => {
    if (!dialogOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isProcessingRef.current) return;

      // Enter key indicates end of barcode scan
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentBuffer = barcodeBufferRef.current;
        
        if (currentBuffer && !isProcessingRef.current) {
          isProcessingRef.current = true;
          barcodeBufferRef.current = ''; // Clear immediately
          
          if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
            barcodeTimeoutRef.current = undefined;
          }
          
          // Process barcode
          handleBarcodeScanned(currentBuffer);
        }
        return;
      }

      // Build barcode from keystrokes (only printable characters)
      if (e.key.length === 1 && !isProcessingRef.current) {
        e.preventDefault();
        barcodeBufferRef.current += e.key;
        
        // Clear buffer after 150ms of no input (barcode scanners are fast)
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
        }
        barcodeTimeoutRef.current = setTimeout(() => {
          if (!isProcessingRef.current) {
            barcodeBufferRef.current = '';
          }
        }, 150);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [dialogOpen]); // REMOVED barcodeBuffer from dependencies!

  // Load all data when period changes
  const loadAllData = async (period: Period, page = 0) => {
    const { startDate, endDate } = getDateRange(period);

    // Load summary
    try {
      const res = await fetchSummaryByDateRangeAction(startDate, endDate);
      if (res.success && res.data) setSummary(res.data);
    } catch { /* silent */ }

    // Load transactions with pagination
    try {
      const res = await fetchSalesWithFiltersAction({
        startDate,
        endDate,
        sortBy: 'date',
        direction: 'desc',
        page,
        size: pageSize,
      });
      if (res.success && res.data) {
        setSales(res.data.content);
        setCurrentPage(res.data.page);
        setTotalPages(res.data.totalPages);
        setTotalElements(res.data.totalElements);
      }
    } catch { /* silent */ }

    // Load top selling
    setIsLoadingTop(true);
    try {
      if (period === 'all') {
        const res = await fetchTopSellingProductsAction(10);
        if (res.success && res.data) setTopSelling(res.data);
      } else if (startDate && endDate) {
        const res = await fetchTopSellingProductsByRangeAction(startDate, endDate, 10);
        if (res.success && res.data) setTopSelling(res.data);
      }
    } catch { /* silent */ }
    setIsLoadingTop(false);
  };

  // Fetch on mount and when period changes
  useEffect(() => {
    setCurrentPage(0);
    loadAllData(activePeriod, 0);
  }, [activePeriod]);

  const handleBarcodeScanned = async (barcode: string) => {
    if (isProcessingRef.current) return;
    if (!barcode || barcode.trim().length === 0) return;
    
    const now = Date.now();
    if (barcode === lastScannedBarcodeRef.current && now - lastScanTimeRef.current < 1000) return;
    lastScannedBarcodeRef.current = barcode;
    lastScanTimeRef.current = now;
    isProcessingRef.current = true; // Lock immediately
    isCameraScanningRef.current = true; // Lock camera scanner
    
    try {
      setIsLoading(true);
      const response = await findProductByBarcodeAction(barcode);
      
      if (response.success && response.data) {
        // Convert AdminProductDetail to AdminProduct format
        const product: AdminProduct = {
          id: response.data.id,
          name: response.data.name,
          barcode: response.data.barcode,
          costPrice: response.data.costPrice,
          price: response.data.price,
          discountPercent: response.data.discountPercent,
          discountedPrice: response.data.discountedPrice,
          profit: response.data.profit,
          stockQuantity: response.data.stockQuantity,
          imageUrl: response.data.imageUrl,
          brandName: response.data.brand?.name,
          categoryName: response.data.category.name,
        };
        
        handleAddToCart(product);
      } else {
        toast.error(`Product not found`);
      }
    } catch {
      toast.error('Scan failed, try again');
    } finally {
      setIsLoading(false);
      
      setTimeout(() => {
        clearBarcodeCache();
        isCameraScanningRef.current = false;
      }, 800);
    }
  };

  const handleBarcodeInputSubmit = async () => {
    const barcode = barcodeInput.trim();
    
    if (!barcode) {
      toast.error('Please enter a barcode');
      return;
    }
    
    if (isProcessingRef.current) return;
    
    // Clear input immediately
    setBarcodeInput('');
    
    // Process barcode
    await handleBarcodeScanned(barcode);
  };

  const handleBarcodeInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeInputSubmit();
    }
  };

  // Filter products by search and category (with safety check)
  const filteredProducts = (availableProducts || []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Match by category name since AdminProduct doesn't have categoryId
    const matchesCategory = filterCategory === 'all' || 
      (categories && categories.find(c => c.id === filterCategory)?.name === p.categoryName);
    
    return matchesSearch && matchesCategory;
  });

  // Calculate cart total
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = parseFloat(formData.discountAmount) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discount);

  const handleAddToCart = (product: AdminProduct) => {
    // Check if product is out of stock
    if (product.stockQuantity <= 0) {
      toast.error(`Out of stock: ${product.name}`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.stockQuantity) {
        toast.error(`Only ${product.stockQuantity} available`);
        return;
      }

      // Increase quantity
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { 
              ...item, 
              quantity: newQuantity,
              subtotal: newQuantity * item.product.discountedPrice 
            }
          : item
      ));
      toast.success(`${product.name} x${newQuantity}`);
    } else {
      // Add new item
      setCart([...cart, {
        productId: product.id,
        quantity: 1,
        product,
        subtotal: product.discountedPrice,
      }]);
      toast.success(`Added: ${product.name}`);
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }

    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    // Check if new quantity exceeds available stock
    if (newQuantity > item.product.stockQuantity) {
      toast.error(`Cannot set quantity to ${newQuantity}! Only ${item.product.stockQuantity} available`);
      return;
    }

    setCart(cart.map(i => 
      i.productId === productId 
        ? { 
            ...i, 
            quantity: newQuantity,
            subtotal: newQuantity * i.product.discountedPrice 
          }
        : i
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.info('Item removed from cart');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart');
      return;
    }

    // Validate stock before submitting
    for (const item of cart) {
      if (item.product.stockQuantity <= 0) {
        toast.error(`${item.product.name} is out of stock! Please remove it from cart.`);
        return;
      }
      if (item.quantity > item.product.stockQuantity) {
        toast.error(`${item.product.name}: Only ${item.product.stockQuantity} available, but you have ${item.quantity} in cart!`);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Build clean request object (only include fields with values)
      const saleRequest: any = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: formData.paymentMethod,
      };

      // Only add optional fields if they have values
      if (formData.customerName && formData.customerName.trim()) {
        saleRequest.customerName = formData.customerName.trim();
      }
      
      if (formData.customerPhone && formData.customerPhone.trim()) {
        saleRequest.customerPhone = formData.customerPhone.trim();
      }
      
      if (discount > 0) {
        saleRequest.discountAmount = discount;
      }
      
      if (formData.notes && formData.notes.trim()) {
        saleRequest.notes = formData.notes.trim();
      }

      const response = await createSaleAction(saleRequest as SaleRequest);

      if (response.success && response.data) {
        // Convert full Sale to SaleListItem for the list
        const newSaleListItem: SaleListItem = {
          id: response.data.id,
          customerName: response.data.customerName,
          itemCount: response.data.items.length,
          totalAmount: response.data.totalAmount,
          profit: response.data.profit,
          paymentMethod: response.data.paymentMethod,
          createdAt: response.data.createdAt,
        };
        
        setSales([newSaleListItem, ...sales]);
        toast.success('Sale completed successfully! 🎉');
        
        // Update summary
        if (summary && response.data) {
          const itemsCount = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
          setSummary({
            ...summary,
            totalSales: summary.totalSales + 1,
            totalRevenue: summary.totalRevenue + response.data.totalAmount,
            totalCost: summary.totalCost + response.data.totalCost,
            totalProfit: summary.totalProfit + response.data.profit,
            totalProductsSold: (summary.totalProductsSold || 0) + itemsCount,
          });
        }

        // Open receipt dialog
        setReceiptDialog({ open: true, sale: response.data });

        // Reset form
        setDialogOpen(false);
        setCart([]);
        setFormData({
          customerName: '',
          customerPhone: '',
          discountAmount: '',
          paymentMethod: 'CASH',
          notes: '',
        });
        setSearchTerm('');
      } else {
        toast.error(response.message || 'Failed to create sale');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSale = async (saleId: string) => {
    try {
      setIsLoading(true);
      const response = await fetchSaleDetailAction(saleId);
      
      if (response.success && response.data) {
        setViewDialog({ open: true, sale: response.data });
      } else {
        toast.error(response.message || 'Failed to load sale details');
      }
    } catch {
      toast.error('Failed to load sale details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening refund dialog
  const handleOpenRefund = async (saleId: string) => {
    try {
      setIsLoading(true);
      const response = await fetchSaleDetailAction(saleId);
      
      if (response.success && response.data) {
        setRefundDialog({ open: true, sale: response.data });
      } else {
        toast.error(response.message || 'Failed to load sale details');
      }
    } catch {
      toast.error('Failed to load sale details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refund created
  const handleRefundCreated = () => {
    // Refresh sales list
    window.location.reload();
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'excel' | 'pdf', includeItems: boolean = false) => {
    if (!session?.backendToken) {
      toast.error('Authentication required');
      return;
    }

    setIsExporting(true);
    try {
      const { startDate, endDate } = getDateRange(activePeriod);
      const response = await exportSales(format, session.backendToken, { startDate, endDate, includeItems });

      if (response.success) {
        toast.success(`Exported as ${format.toUpperCase()}!`);
      } else {
        toast.error(response.message || 'Failed to export');
      }
    } catch {
      toast.error('Failed to export sales');
    } finally {
      setIsExporting(false);
    }
  };

  // Open receipt dialog for a sale (PDF / Image / Print)
  const handleOpenReceipt = async (saleId: string) => {
    if (!session?.backendToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetchSaleDetailAction(saleId);

      if (!response.success || !response.data) {
        toast.error('Failed to fetch sale details');
        return;
      }

      setReceiptDialog({ open: true, sale: response.data });
    } catch {
      toast.error('Failed to load receipt');
    }
  };

  // Refresh data for current period
  const handleRefresh = () => loadAllData(activePeriod, currentPage);

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadAllData(activePeriod, page);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sales</h1>
          <p className="text-sm text-muted-foreground">Point of Sale & Transactions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="shadow-lg hover:shadow-xl transition-all">
          <ShoppingCart className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* ── Unified Date Period Filter ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <Button
            key={p}
            variant={activePeriod === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {/* ── Tabs: Overview / Top Selling / Analytics ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top-selling">Top Selling</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ── TAB: Overview ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Performance Summary */}
          {summary && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <Card className="hover:shadow-lg transition-all border-2 hover:border-blue-300">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <div className="text-2xl font-black text-blue-600">{summary.totalSales}</div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-2 hover:border-purple-300">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Products Sold</p>
                  <div className="text-2xl font-black text-purple-600">{summary.totalProductsSold || 0}</div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-2 hover:border-emerald-300">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <div className="text-2xl font-black text-emerald-600">{formatUSD(summary.totalRevenue)}</div>
                  <p className="text-[10px] text-muted-foreground">{formatKHR(summary.totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-2 hover:border-orange-300">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Cost</p>
                  <div className="text-2xl font-black text-orange-600">{formatUSD(summary.totalCost)}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Profit</p>
                  <div className="text-2xl font-black text-green-600">{formatUSD(summary.totalProfit)}</div>
                  <p className="text-[10px] text-green-600">{formatKHR(summary.totalProfit)}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-2 hover:border-cyan-300">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground mb-1">Margin</p>
                  <div className="text-2xl font-black text-cyan-600">{summary.profitMargin.toFixed(1)}%</div>
                  <div className="mt-1 h-1.5 bg-cyan-100 dark:bg-cyan-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${Math.min(summary.profitMargin, 100)}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Transactions {totalElements > 0 && <span className="text-sm font-normal text-muted-foreground">({totalElements})</span>}</CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv', false)} disabled={isExporting || sales.length === 0}>
                    <Download className="w-3 h-3 mr-1" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('excel', true)} disabled={isExporting || sales.length === 0}>
                    <Download className="w-3 h-3 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sales.length > 0 ? (
                <div className="space-y-2">
                  {sales.map((sale) => {
                    const pm = getPaymentMethodDisplay(sale.paymentMethod || 'CASH');
                    return (
                      <div key={sale.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{sale.customerName || 'Walk-in'}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pm.icon} {pm.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sale.itemCount || 0} items • {new Date(sale.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold">{formatUSD(sale.totalAmount || 0)}</div>
                          <div className="text-xs text-green-600 font-medium">+{formatUSD(sale.profit || 0)}</div>
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewSale(sale.id)} title="View"><Eye className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenReceipt(sale.id)} title="Receipt"><FileText className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenRefund(sale.id)} title="Refund"><Undo2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold mb-1">No sales for this period</p>
                  <p className="text-sm text-muted-foreground mb-4">Try a different date range or create a new sale</p>
                  <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Sale</Button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 pt-3 border-t space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Page {currentPage + 1} of {totalPages} · {totalElements} total
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => { e.preventDefault(); if (currentPage > 0) handlePageChange(currentPage - 1); }}
                          className={currentPage === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {(() => {
                        const pages: (number | 'ellipsis')[] = [];
                        if (totalPages <= 7) {
                          for (let i = 0; i < totalPages; i++) pages.push(i);
                        } else {
                          pages.push(0);
                          if (currentPage > 2) pages.push('ellipsis');
                          const start = Math.max(1, currentPage - 1);
                          const end = Math.min(totalPages - 2, currentPage + 1);
                          for (let i = start; i <= end; i++) pages.push(i);
                          if (currentPage < totalPages - 3) pages.push('ellipsis');
                          pages.push(totalPages - 1);
                        }
                        return pages.map((p, idx) =>
                          p === 'ellipsis' ? (
                            <PaginationItem key={`e-${idx}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={p === currentPage}
                                onClick={(e) => { e.preventDefault(); handlePageChange(p); }}
                                className="cursor-pointer"
                              >
                                {p + 1}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        );
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => { e.preventDefault(); if (currentPage < totalPages - 1) handlePageChange(currentPage + 1); }}
                          className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Top Selling ── */}
        <TabsContent value="top-selling" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Top Selling Products — {periodLabels[activePeriod]}</CardTitle>
              <CardDescription>Best performing products by quantity sold</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTop ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : topSelling.length > 0 ? (
                <div className="space-y-2">
                  {topSelling.map((p, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                    return (
                      <div key={p.productId || i} className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                        <span className="text-lg font-bold w-8 text-center flex-shrink-0">{medal}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground">{p.totalQuantitySold} units sold</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge variant="secondary" className="text-xs font-bold">{p.totalQuantitySold} units</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold mb-1">No data for this period</p>
                  <p className="text-sm text-muted-foreground">Try a different date range</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Analytics ── */}
        <TabsContent value="analytics" className="mt-4">
          <SalesAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Create Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-5xl lg:max-w-6xl h-[95vh] sm:h-[92vh] md:h-[88vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 md:pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg md:text-xl">Point of Sale 💰</DialogTitle>
            <DialogDescription className="text-[10px] sm:text-xs md:text-sm">Select products and complete the transaction</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
            {/* Left: Product Selection */}
            <div className="flex flex-col h-[50vh] lg:h-auto lg:flex-1 flex-shrink-0 lg:flex-shrink px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 min-h-0 overflow-hidden border-r-0 lg:border-r">
              {/* Search & Barcode */}
              <div className="mb-1.5 sm:mb-2 md:mb-3 space-y-1.5 sm:space-y-2 flex-shrink-0 pt-2 sm:pt-3">
                {/* Search Bar with Scan Button */}
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
                    onClick={() => setScannerOpen(true)}
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                {/* Barcode Input */}
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="relative flex-1">
                    <Scan className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleBarcodeInputKeyPress}
                      placeholder="Enter barcode manually..."
                      className="pl-7 sm:pl-9 h-8 sm:h-9 md:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 sm:h-9 md:h-10 px-2 sm:px-3 flex-shrink-0 text-xs sm:text-sm"
                    onClick={handleBarcodeInputSubmit}
                    disabled={!barcodeInput.trim()}
                  >
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Find</span>
                  </Button>
                </div>
                
                {/* Barcode Scanner Info */}
                {scannedBarcode && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/10 rounded-lg border border-primary/30">
                    <Scan className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-primary">Last Scanned:</p>
                      <p className="text-xs sm:text-sm font-mono font-bold truncate">{scannedBarcode}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScannedBarcode('')}
                      className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                )}

                {/* Category Filter - Compact Horizontal Pills */}
                {categories && categories.length > 0 && (
                  <div className="relative overflow-hidden">
                    <div className="overflow-x-auto overflow-y-hidden pb-1 scrollbar-thin">
                      <div className="flex gap-1 sm:gap-1.5 min-w-min">
                        <button
                          type="button"
                          onClick={() => setFilterCategory('all')}
                          className={`flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all ${
                            filterCategory === 'all' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'bg-muted/80 hover:bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          All
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setFilterCategory(category.id)}
                            className={`flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium transition-all whitespace-nowrap ${
                              filterCategory === category.id 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'bg-muted/80 hover:bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Products Grid - Compact */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-0.5 sm:gap-1">
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.stockQuantity <= 0;
                      const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
                      
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className={`group text-left p-0.5 sm:p-1 border rounded transition-all bg-card ${
                            isOutOfStock 
                              ? 'opacity-50 cursor-not-allowed border-destructive/30' 
                              : 'hover:border-primary hover:shadow-md cursor-pointer active:scale-95 hover:z-10'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="aspect-square relative mb-0.5 bg-muted/30 rounded-sm overflow-hidden">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                unoptimized={true}
                                fill
                                className={`object-contain p-0.5 ${isOutOfStock ? 'grayscale' : ''}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground/30" />
                              </div>
                            )}
                            
                            {/* Status Overlay */}
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/75">
                                <span className="text-[7px] sm:text-[8px] font-bold text-white">OUT</span>
                              </div>
                            )}
                            
                            {/* Low Stock Badge */}
                            {!isOutOfStock && isLowStock && (
                              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[6px] sm:text-[7px] font-bold px-0.5 rounded-bl-sm">
                                LOW
                              </div>
                            )}
                          </div>
                          
                          {/* Product Name */}
                          <h4 className="font-medium text-[7px] sm:text-[8px] md:text-[9px] line-clamp-1 sm:line-clamp-2 leading-tight mb-0.5">
                            {product.name}
                          </h4>
                          
                          {/* Price & Stock */}
                          <div className="flex items-center justify-between gap-0.5">
                            <span className="font-bold text-[8px] sm:text-[9px] text-primary truncate">
                              ${product.discountedPrice.toFixed(2)}
                            </span>
                            <span className="text-[6px] sm:text-[7px] text-muted-foreground flex-shrink-0">
                              ×{isOutOfStock ? '0' : product.stockQuantity}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                    <div>
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No products found</p>
                      <p className="text-[10px] mt-1">Try different filters</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-full lg:w-[340px] xl:w-[380px] flex flex-col border-t lg:border-t-0 lg:border-l flex-shrink-0 lg:flex-shrink lg:min-h-0 lg:overflow-hidden">
              {/* Cart Header */}
              <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Cart
                  </h3>
                  <Badge className="text-[9px] sm:text-[10px]">{cart.length} items</Badge>
                </div>
              </div>

              {/* Cart Items */}
              <div className="max-h-[25vh] lg:max-h-none lg:flex-1 overflow-y-auto min-h-0 px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-3">
                {cart.length > 0 ? (
                  <div className="space-y-2">
                    {cart.map((item) => {
                      const isMaxQuantity = item.quantity >= item.product.stockQuantity;
                      const exceedsStock = item.quantity > item.product.stockQuantity;
                      
                      return (
                        <div 
                          key={item.productId} 
                          className={`border rounded-lg p-2 transition-all ${exceedsStock ? 'border-destructive bg-destructive/5' : 'hover:shadow-sm'}`}
                        >
                          <div className="flex gap-2 mb-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 relative bg-muted rounded flex-shrink-0">
                              {item.product.imageUrl ? (
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  fill
                                  className="object-contain p-0.5 sm:p-1"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-[10px] sm:text-xs md:text-sm line-clamp-1">{item.product.name}</h5>
                              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">${item.product.discountedPrice.toFixed(2)}</p>
                              {exceedsStock && (
                                <p className="text-[9px] sm:text-[10px] text-destructive font-medium mt-0.5">
                                  Only {item.product.stockQuantity} available!
                                </p>
                              )}
                              {!exceedsStock && isMaxQuantity && (
                                <p className="text-[9px] sm:text-[10px] text-orange-500 font-medium mt-0.5">
                                  Max quantity
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleRemoveFromCart(item.productId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border rounded">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                              <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-medium">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7"
                                disabled={isMaxQuantity}
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                            <span className="font-bold text-xs sm:text-sm text-primary">${item.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-muted-foreground">
                      <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                      <p className="text-xs sm:text-sm">Cart is empty</p>
                      <p className="text-[10px] sm:text-xs mt-1">Click products to add</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout */}
              <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 border-t space-y-1.5 sm:space-y-2 md:space-y-3 flex-shrink-0">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Customer (optional)"
                    className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                  />
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="Phone (optional)"
                    className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD') => 
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">💵 Cash</SelectItem>
                      <SelectItem value="CARD">💳 Card</SelectItem>
                      <SelectItem value="E_WALLET">📱 E-Wallet</SelectItem>
                      <SelectItem value="BANK_TRANSFER">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="COD">📦 Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    placeholder="Discount"
                    className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                  />
                </div>

                <div className="space-y-0.5 sm:space-y-1 pt-1 sm:pt-2">
                  <div className="flex justify-between text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[10px] sm:text-xs md:text-sm text-destructive">
                      <span>Discount:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 sm:pt-2 border-t">
                    <span className="font-semibold text-xs sm:text-sm md:text-base">Total:</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || cart.length === 0}
                    className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm"
                  >
                    {isLoading ? 'Processing...' : 'Complete Sale'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, sale: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>Transaction information</DialogDescription>
          </DialogHeader>
          {viewDialog.sale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Customer</Label>
                  <p>{viewDialog.sale.customerName || 'Walk-in'}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p>{viewDialog.sale.customerPhone || '-'}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  {(() => {
                    const pmDisplay = getPaymentMethodDisplay(viewDialog.sale.paymentMethod);
                    return (
                      <Badge className={`${pmDisplay.color} mt-1`}>
                        {pmDisplay.icon} {pmDisplay.label}
                      </Badge>
                    );
                  })()}
                </div>
                <div>
                  <Label>Date</Label>
                  <p>{new Date(viewDialog.sale.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label>Items</Label>
                <div className="space-y-2 mt-2">
                  {(viewDialog.sale.items || []).map((item, index) => (
                    <div key={index} className="p-3 border rounded space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{item.productName}</span>
                        <span>${(item.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex justify-between">
                        <span>{item.quantity || 0} × ${(item.unitPrice || 0).toFixed(2)}</span>
                        <span className="text-green-600">+${(item.profit || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-xl">${(viewDialog.sale.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-semibold">Profit:</span>
                  <span className="text-green-600 font-bold">
                    ${(viewDialog.sale.profit || 0).toFixed(2)} ({(viewDialog.sale.profitMargin || 0).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {viewDialog.sale.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewDialog.sale.notes}</p>
                </div>
              )}

              {/* Receipt Button */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    if (viewDialog.sale) {
                      setReceiptDialog({ open: true, sale: viewDialog.sale });
                    }
                  }}
                  className="flex-1"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={receiptDialog.open}
        onClose={() => setReceiptDialog({ open: false, sale: null })}
        sale={receiptDialog.sale}
        storeName="Rolly Shop"
        storeAddress="123 Main Street, City"
        storePhone="+1 (555) 123-4567"
      />

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        open={scannerOpen && !isCameraScanningRef.current}
        onClose={() => setScannerOpen(false)}
        onScan={(barcode) => {
          setScannerOpen(false);
          handleBarcodeScanned(barcode);
        }}
      />

      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialog.open}
        onOpenChange={(open) => setRefundDialog({ open, sale: null })}
        sale={refundDialog.sale}
        onRefundCreated={handleRefundCreated}
      />
    </div>
  );
}
