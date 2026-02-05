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
  BarChart3,
  FileText,
  Printer,
  Box,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

import type { Sale, SaleListItem, SaleSummary, SaleRequest, SaleItem } from '@/types/sales.types';
import type { AdminProduct } from '@/types/product.types';
import { 
  createSaleAction, 
  fetchSaleDetailAction, 
  fetchTodaysSummaryAction 
} from '@/actions/sales/sales.action';
import { findProductByBarcodeAction } from '@/actions/products/barcode.action';
import BarcodeScanner from './BarcodeScanner';
import { downloadReceipt, printReceipt } from '@/lib/receipt-generator';
import ReceiptDialog from './ReceiptDialog';
import TopSellingProducts from './TopSellingProducts';
import { SalesAnalyticsDashboard } from './SalesAnalyticsDashboard';
import { RefundDialog } from './RefundDialog';
import { SalesAdvancedFilters, type SalesFilters } from './SalesAdvancedFilters';
import { exportSales, getReceiptPdf, fetchSalesWithFilters } from '@/services/sales.service';

interface SalesManagementProps {
  initialSales: SaleListItem[]; // Changed from Sale[] to SaleListItem[]
  initialSummary: SaleSummary | null;
  availableProducts?: AdminProduct[]; // Make it optional with safety
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

export default function SalesManagement({ initialSales, initialSummary, availableProducts }: SalesManagementProps) {
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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState<SaleFormData>({
    customerName: '',
    customerPhone: '',
    discountAmount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  // Advanced filters state
  const [filters, setFilters] = useState<SalesFilters>({
    paymentMethod: 'ALL',
    sortBy: 'date',
    direction: 'desc',
  });

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
    if (dialogOpen) {
      // Clear all barcode-related state for fresh start
      clearBarcodeCache();
      console.log('🧹 POS opened - barcode cache cleared');
    } else {
      // Clean up when closing
      clearBarcodeCache();
      console.log('🧹 POS closed - barcode cache cleared');
    }
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

      // Ignore if already processing a barcode
      if (isProcessingRef.current) {
        console.log('⏸️ Barcode scan in progress, ignoring input...');
        return;
      }

      // Enter key indicates end of barcode scan
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentBuffer = barcodeBufferRef.current;
        
        if (currentBuffer && !isProcessingRef.current) {
          console.log('⌨️ Keyboard scan complete:', currentBuffer);
          isProcessingRef.current = true; // Lock processing
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
            console.log('🧹 Buffer auto-cleared (timeout)');
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

  // Fetch today's summary on mount and periodically
  useEffect(() => {
    const loadTodaysSummary = async () => {
      try {
        const response = await fetchTodaysSummaryAction();
        if (response.success && response.data) {
          setSummary(response.data);
          console.log('✅ Today\'s summary updated:', response.data);
        } else {
          console.log('⚠️ Failed to fetch today\'s summary:', response.message);
        }
      } catch (error) {
        console.error('❌ Error fetching today\'s summary:', error);
      }
    };

    // Load immediately
    loadTodaysSummary();

    // Refresh every 30 seconds to keep stats current
    const interval = setInterval(loadTodaysSummary, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleBarcodeScanned = async (barcode: string) => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      console.log('⏸️ Scan in progress, ignoring...');
      return;
    }
    
    // Validate barcode
    if (!barcode || barcode.trim().length === 0) {
      console.log('⚠️ Empty barcode, ignoring...');
      return;
    }
    
    // Prevent scanning same barcode within 1 second (debounce)
    const now = Date.now();
    if (barcode === lastScannedBarcodeRef.current && now - lastScanTimeRef.current < 1000) {
      console.log('⏸️ Same barcode scanned too quickly, ignoring...');
      return;
    }
    
    console.log('🔍 Processing barcode:', barcode);
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
          brandName: response.data.brand.name,
          categoryName: response.data.category.name,
        };
        
        // Add to cart (will increase qty if already exists)
        handleAddToCart(product);
        
        console.log('✅ Product added via barcode:', product.name);
      } else {
        toast.error(`Product not found`);
        console.log('❌ Barcode not found:', barcode);
      }
    } catch (error) {
      console.error('❌ Barcode scan error:', error);
      toast.error('Scan failed, try again');
    } finally {
      setIsLoading(false);
      
      // Delay before allowing next scan (prevents double-scan)
      setTimeout(() => {
        clearBarcodeCache();
        isCameraScanningRef.current = false; // Unlock camera scanner
        // Don't clear lastScannedBarcodeRef - keep for 1 second debounce
        console.log('🔓 Ready for next scan');
      }, 800); // Increased to 800ms for more reliable debouncing
    }
  };

  const handleBarcodeInputSubmit = async () => {
    const barcode = barcodeInput.trim();
    
    if (!barcode) {
      toast.error('Please enter a barcode');
      return;
    }
    
    if (isProcessingRef.current) {
      console.log('⏸️ Already processing, please wait...');
      return;
    }
    
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

  // Filter products by search (with safety check)
  const filteredProducts = (availableProducts || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      console.log('🛒 Submitting sale request:', JSON.stringify(saleRequest, null, 2));

      const response = await createSaleAction(saleRequest as SaleRequest);

      console.log('📦 Sale response:', response);

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
        console.error('❌ Sale failed:', response.message);
        toast.error(response.message || 'Failed to create sale');
      }
    } catch (error) {
      console.error('❌ Sale error:', error);
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
    } catch (error) {
      console.error('Error loading sale details:', error);
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
    } catch (error) {
      console.error('Error loading sale details:', error);
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
      const exportFilters = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod !== 'ALL' ? filters.paymentMethod : undefined,
        includeItems,
      };

      const response = await exportSales(format, session.backendToken, exportFilters);

      if (response.success) {
        toast.success(`Sales exported successfully as ${format.toUpperCase()}!`);
      } else {
        toast.error(response.message || 'Failed to export sales');
      }
    } catch (error) {
      console.error('Error exporting sales:', error);
      toast.error('Failed to export sales');
    } finally {
      setIsExporting(false);
    }
  };

  // Download receipt PDF - Enhanced version
  const handleDownloadPdf = async (saleId: string) => {
    if (!session?.backendToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      // Fetch full sale details
      const response = await fetchSaleDetailAction(saleId);
      
      if (!response.success || !response.data) {
        toast.error('Failed to fetch sale details');
        return;
      }

      // Generate and download enhanced receipt
      await downloadReceipt(response.data, {
        storeName: 'Rolly Online Shop',
        storeAddress: '123 Business Street, City, Country',
        storePhone: '+1 234 567 8900',
        storeEmail: 'info@rollyshop.com',
      });
      
      toast.success('Receipt PDF downloaded!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  // Print receipt
  const handlePrintReceipt = async (saleId: string) => {
    if (!session?.backendToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      // Fetch full sale details
      const response = await fetchSaleDetailAction(saleId);
      
      if (!response.success || !response.data) {
        toast.error('Failed to fetch sale details');
        return;
      }

      // Generate and print receipt
      await printReceipt(response.data, {
        storeName: 'Rolly Online Shop',
        storeAddress: '123 Business Street, City, Country',
        storePhone: '+1 234 567 8900',
        storeEmail: 'info@rollyshop.com',
      });
      
      toast.success('Receipt sent to printer!');
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Failed to print receipt');
    }
  };

  // Apply filters
  const handleApplyFilters = async () => {
    if (!session?.backendToken) return;

    setIsLoading(true);
    try {
      const filterParams = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod !== 'ALL' ? filters.paymentMethod : undefined,
        minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
        customerName: filters.customerName,
        sortBy: filters.sortBy || 'date',
        direction: filters.direction || 'desc',
      };

      const response = await fetchSalesWithFilters(filterParams, session.backendToken);

      if (response.success && response.data) {
        setSales(response.data.content);
        toast.success(`Found ${response.data.totalElements} sales`);
      } else {
        toast.error(response.message || 'Failed to fetch sales');
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to fetch sales');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Sales 🛒</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Point of Sale & Transactions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showAnalytics ? 'default' : 'outline'}
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex-1 sm:flex-none"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
          <Button 
            onClick={() => setDialogOpen(true)} 
            size="lg"
            className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transition-all"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <SalesAnalyticsDashboard />
      )}

      {/* Top Selling Products Section */}
      <TopSellingProducts />

      {/* Enhanced Summary Dashboard - Today's Performance */}
      {summary && (
        <div className="space-y-4">
          {/* Main Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Today's Performance 📊</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats Grid - Enhanced Design */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* Transactions Count */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                    <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-blue-600">{summary.totalSales}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  Sales completed
                </p>
              </CardContent>
            </Card>

            {/* Products Sold */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Products Sold</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-purple-600">{summary.totalProductsSold || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Box className="w-3 h-3" />
                  Total units moved
                </p>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-emerald-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-lg">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-600">${summary.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Total collected
                </p>
              </CardContent>
            </Card>

            {/* Cost */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cost</CardTitle>
                  <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                    <Minus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-orange-600">${summary.totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  Goods cost
                </p>
              </CardContent>
            </Card>

            {/* Profit - Highlighted */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full -mr-12 -mt-12" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">💰 Profit</CardTitle>
                  <div className="p-2 bg-green-200 dark:bg-green-900 rounded-lg shadow-md">
                    <TrendingUp className="w-5 h-5 text-green-700 dark:text-green-300" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-green-600 dark:text-green-400">${summary.totalProfit.toFixed(2)}</div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Net earnings today
                </p>
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Per transaction:</span>
                    <span className="font-bold text-green-600">
                      ${summary.totalSales > 0 ? (summary.totalProfit / summary.totalSales).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Margin */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-cyan-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Margin</CardTitle>
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-950 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-cyan-600">{summary.profitMargin.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Profit margin
                </p>
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="h-2 bg-cyan-100 dark:bg-cyan-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(summary.profitMargin, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          {summary.totalSales > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-2">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average Order Value</p>
                      <p className="text-lg font-bold">
                        ${(summary.totalRevenue / summary.totalSales).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Products per Order</p>
                      <p className="text-lg font-bold">
                        {((summary.totalProductsSold || 0) / summary.totalSales).toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit per Product</p>
                      <p className="text-lg font-bold text-green-600">
                        ${((summary.totalProductsSold || 0) > 0 ? summary.totalProfit / (summary.totalProductsSold || 1) : 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      <SalesAdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
      />

      {/* Sales List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales and their details</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv', false)}
                disabled={isExporting || sales.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel', true)}
                disabled={isExporting || sales.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf', false)}
                disabled={isExporting || sales.length === 0}
              >
                <FileText className="w-3 h-3 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">
                            {sale.customerName || 'Walk-in Customer'}
                          </h4>
                          {(() => {
                            const pmDisplay = getPaymentMethodDisplay(sale.paymentMethod || 'CASH');
                            return (
                              <Badge className={pmDisplay.color}>
                                {pmDisplay.icon} {pmDisplay.label}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{sale.itemCount || 0} items</span>
                          <span>•</span>
                          <span>{new Date(sale.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">${(sale.totalAmount || 0).toFixed(2)}</div>
                          <div className="text-sm">
                            <span className="text-green-600 font-semibold">
                              +${(sale.profit || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSale(sale.id)}
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRefund(sale.id)}
                            title="Process Refund"
                          >
                            <Undo2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPdf(sale.id)}
                            title="Download PDF"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReceipt(sale.id)}
                            title="Print Receipt"
                          >
                            <Printer className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Start by creating your first sale
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Sale
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
            <DialogTitle className="text-lg md:text-xl">Point of Sale</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Select products and complete the transaction</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[calc(90vh-80px)] md:h-[calc(85vh-100px)]">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6 overflow-hidden">
              {/* Search & Barcode */}
              <div className="mb-3 md:mb-4 space-y-2">
                {/* Search Bar with Scan Button */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="pl-9 h-9 md:h-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0"
                    onClick={() => setScannerOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Barcode Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleBarcodeInputKeyPress}
                      placeholder="Enter barcode manually..."
                      className="pl-9 h-9 md:h-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-9 md:h-10 px-3 flex-shrink-0"
                    onClick={handleBarcodeInputSubmit}
                    disabled={!barcodeInput.trim()}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Find
                  </Button>
                </div>
                
                {/* Barcode Scanner Info */}
                {scannedBarcode && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
                    <Scan className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary">Last Scanned:</p>
                      <p className="text-sm font-mono font-bold truncate">{scannedBarcode}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScannedBarcode('')}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.stockQuantity <= 0;
                      const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
                      
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className={`text-left p-2 md:p-3 border rounded-lg transition-colors bg-card ${
                            isOutOfStock 
                              ? 'opacity-50 cursor-not-allowed border-destructive/30' 
                              : 'hover:border-primary cursor-pointer'
                          }`}
                        >
                          <div className="aspect-square relative mb-2 bg-muted rounded overflow-hidden">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                unoptimized={true}
                                fill
                                className={`object-contain p-1 md:p-2 ${isOutOfStock ? 'grayscale' : ''}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                              </div>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <Badge variant="destructive" className="text-xs">OUT OF STOCK</Badge>
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-xs md:text-sm line-clamp-2 mb-1">{product.name}</h4>
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">{product.brandName}</p>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs md:text-sm">${product.discountedPrice.toFixed(2)}</span>
                            <Badge 
                              variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "outline"} 
                              className="text-[10px] md:text-xs px-1 md:px-2"
                            >
                              {isOutOfStock ? '0' : product.stockQuantity}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <div>
                      <Package className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
                      <p className="text-xs md:text-sm">No products found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-full md:w-[380px] flex flex-col md:border-l border-t md:border-t-0 max-h-[50vh] md:max-h-none">
              {/* Cart Header */}
              <div className="px-4 md:px-6 py-3 md:py-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm md:text-base">Cart</h3>
                  <Badge className="text-xs">{cart.length} items</Badge>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
                {cart.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {cart.map((item) => {
                      const isMaxQuantity = item.quantity >= item.product.stockQuantity;
                      const exceedsStock = item.quantity > item.product.stockQuantity;
                      
                      return (
                        <div 
                          key={item.productId} 
                          className={`border rounded-lg p-2 md:p-3 ${exceedsStock ? 'border-destructive bg-destructive/5' : ''}`}
                        >
                          <div className="flex gap-2 md:gap-3 mb-2">
                            <div className="w-10 h-10 md:w-12 md:h-12 relative bg-muted rounded flex-shrink-0">
                              {item.product.imageUrl ? (
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  fill
                                  className="object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-xs md:text-sm line-clamp-1">{item.product.name}</h5>
                              <p className="text-[10px] md:text-xs text-muted-foreground">${item.product.discountedPrice.toFixed(2)}</p>
                              {exceedsStock && (
                                <p className="text-[10px] text-destructive font-medium mt-0.5">
                                  Only {item.product.stockQuantity} available!
                                </p>
                              )}
                              {!exceedsStock && isMaxQuantity && (
                                <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                                  Max quantity
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 md:h-6 md:w-6"
                              onClick={() => handleRemoveFromCart(item.productId)}
                            >
                              <X className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border rounded">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 md:h-7 md:w-7"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-2 w-2 md:h-3 md:w-3" />
                              </Button>
                              <span className="w-6 md:w-8 text-center text-xs md:text-sm font-medium">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 md:h-7 md:w-7"
                                disabled={isMaxQuantity}
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-2 w-2 md:h-3 md:w-3" />
                              </Button>
                            </div>
                            <span className="font-semibold text-xs md:text-sm">${item.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-muted-foreground">
                      <ShoppingCart className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
                      <p className="text-xs md:text-sm">Cart is empty</p>
                      <p className="text-[10px] md:text-xs mt-1">Click products to add</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout */}
              <div className="px-4 md:px-6 py-3 md:py-4 border-t space-y-2 md:space-y-3">
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Customer name (optional)"
                  className="h-8 md:h-9 text-xs md:text-sm"
                />
                <Input
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="h-8 md:h-9 text-xs md:text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD') => 
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
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
                    className="h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div className="space-y-1 md:space-y-2 pt-2">
                  <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs md:text-sm text-destructive">
                      <span>Discount:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold text-sm md:text-base">Total:</span>
                    <span className="text-xl md:text-2xl font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    className="h-8 md:h-9 text-xs md:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || cart.length === 0}
                    className="h-8 md:h-9 text-xs md:text-sm"
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
        onClose={() => {
          setScannerOpen(false);
          console.log('📷 Camera scanner closed');
        }}
        onScan={(barcode) => {
          console.log('📷 Camera detected barcode:', barcode);
          setScannerOpen(false); // Close immediately
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
