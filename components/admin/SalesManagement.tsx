'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Receipt, DollarSign, TrendingUp, Package, Eye, Search, Minus, X, Scan, Camera } from 'lucide-react';
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
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  notes: string;
}

export default function SalesManagement({ initialSales, initialSummary, availableProducts }: SalesManagementProps) {
  const [sales, setSales] = useState<SaleListItem[]>(initialSales || []);
  const [summary, setSummary] = useState<SaleSummary | null>(initialSummary);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; sale: Sale | null }>({
    open: false,
    sale: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState<SaleFormData>({
    customerName: '',
    customerPhone: '',
    discountAmount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  // Barcode scanner states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isProcessingRef = useRef(false); // Prevent concurrent scans

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
    setBarcodeBuffer('');
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
        const currentBuffer = barcodeBuffer;
        
        if (currentBuffer && !isProcessingRef.current) {
          console.log('⌨️ Keyboard scan complete:', currentBuffer);
          isProcessingRef.current = true; // Lock processing
          setBarcodeBuffer(''); // Clear immediately
          
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
        setBarcodeBuffer(prev => prev + e.key);
        
        // Clear buffer after 150ms of no input (barcode scanners are fast)
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
        }
        barcodeTimeoutRef.current = setTimeout(() => {
          if (!isProcessingRef.current) {
            setBarcodeBuffer('');
            console.log('🧹 Buffer auto-cleared (timeout)');
          }
        }, 150); // Increased to 150ms for better reliability
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [dialogOpen, barcodeBuffer]);

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
    
    console.log('🔍 Processing barcode:', barcode);
    isProcessingRef.current = true; // Lock immediately
    
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
        console.log('🔓 Ready for next scan');
      }, 500); // Increased to 500ms for better debouncing
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
          setSummary({
            ...summary,
            totalSales: summary.totalSales + 1,
            totalRevenue: summary.totalRevenue + response.data.totalAmount,
            totalCost: summary.totalCost + response.data.totalCost,
            totalProfit: summary.totalProfit + response.data.profit,
          });
        }

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Point of Sale & Transaction Management</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg">
          <ShoppingCart className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Summary Dashboard */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sales Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalSales}</div>
              <p className="text-xs text-muted-foreground mt-1">Transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">${summary.totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Goods sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${summary.totalProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Net profit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.profitMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Profit margin</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest sales and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {sale.customerName || 'Walk-in Customer'}
                          </h4>
                          <Badge variant="outline">{sale.paymentMethod || 'CASH'}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{sale.itemCount || 0} items</span>
                          <span>•</span>
                          <span>{new Date(sale.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold">${(sale.totalAmount || 0).toFixed(2)}</div>
                        <div className="text-sm">
                          <span className="text-green-600 font-semibold">
                            +${(sale.profit || 0).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSale(sale.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
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
                    onValueChange={(value: 'CASH' | 'CARD' | 'ONLINE') => 
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">💵 Cash</SelectItem>
                      <SelectItem value="CARD">💳 Card</SelectItem>
                      <SelectItem value="ONLINE">🌐 Online</SelectItem>
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
                  <Label>Payment</Label>
                  <p>{viewDialog.sale.paymentMethod}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
}
