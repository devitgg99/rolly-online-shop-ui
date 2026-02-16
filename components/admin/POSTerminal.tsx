'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  ShoppingCart, Search, Package, Plus, Minus, X,
  CreditCard, Banknote, Smartphone, Building2, Truck,
  ChevronDown, ChevronRight, GitBranch, Receipt as ReceiptIcon,
  Camera, User, Tag, ShoppingBag,
  Check, Loader2, RotateCcw, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatUSD } from '@/lib/currency';

import type { AdminProduct } from '@/types/product.types';
import type { Category } from '@/types/category.types';
import type { SaleRequest, Sale } from '@/types/sales.types';
import { createSaleAction } from '@/actions/sales/sales.action';
import { findProductByBarcodeAction } from '@/actions/products/barcode.action';
import BarcodeScanner from './BarcodeScanner';
import ReceiptDialog from './ReceiptDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  product: AdminProduct;
  quantity: number;
  subtotal: number;
}

interface POSTerminalProps {
  products: AdminProduct[];
  categories: Category[];
}

type PaymentMethod = 'CASH' | 'CARD' | 'E_WALLET' | 'BANK_TRANSFER' | 'COD';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'E_WALLET', label: 'E-Wallet', icon: Smartphone },
  { value: 'BANK_TRANSFER', label: 'Transfer', icon: Building2 },
  { value: 'COD', label: 'COD', icon: Truck },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function POSTerminal({ products, categories }: POSTerminalProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(true);
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef('');
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanTimeRef = useRef(0);

  // ─── Derived Data ───────────────────────────────────────────────────────────

  const variantsByParent = useMemo(() => {
    return products.reduce<Record<string, AdminProduct[]>>((acc, p) => {
      if (p.isVariant && p.parentProductId) {
        if (!acc[p.parentProductId]) acc[p.parentProductId] = [];
        acc[p.parentProductId].push(p);
      }
      return acc;
    }, {});
  }, [products]);

  const parentIdsWithVariants = useMemo(
    () => new Set(Object.keys(variantsByParent)),
    [variantsByParent]
  );

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      // Hide child variants from main grid (shown under parent)
      if (p.isVariant && p.parentProductId) return false;
      return true;
    });

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryName === selectedCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchedParentIds = new Set<string>();

      // Check if any child variant matches search
      products.forEach(p => {
        if (p.isVariant && p.parentProductId) {
          const variantStr = [p.name, p.variantCode, p.variantColor, p.variantSize, p.barcode]
            .filter(Boolean).join(' ').toLowerCase();
          if (variantStr.includes(q)) {
            matchedParentIds.add(p.parentProductId!);
          }
        }
      });

      filtered = filtered.filter(p => {
        const str = [p.name, p.barcode, p.categoryName].filter(Boolean).join(' ').toLowerCase();
        return str.includes(q) || matchedParentIds.has(p.id);
      });
    }

    return filtered;
  }, [products, selectedCategory, searchTerm, variantsByParent]);

  // ─── Cart Calculations ──────────────────────────────────────────────────────

  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.subtotal, 0), [cart]);
  const discountAmount = parseFloat(discount) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ─── Variant Helpers ────────────────────────────────────────────────────────

  const getVariantLabel = useCallback((product: AdminProduct): string => {
    const parts: string[] = [];
    if (product.variantCode) parts.push(`#${product.variantCode}`);
    if (product.variantColor) parts.push(product.variantColor);
    if (product.variantSize) parts.push(product.variantSize);
    return parts.join(' · ');
  }, []);

  const getParentTotalStock = useCallback((productId: string): number => {
    const product = products.find(p => p.id === productId);
    if (product?.totalVariantStock != null) return product.totalVariantStock;
    return variantsByParent[productId]?.reduce((s, v) => s + v.stockQuantity, 0) ?? 0;
  }, [products, variantsByParent]);

  // ─── Cart Actions ───────────────────────────────────────────────────────────

  const addToCart = useCallback((product: AdminProduct) => {
    if (product.stockQuantity <= 0) {
      toast.error('Out of stock');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} available`);
          return prev;
        }
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * product.discountedPrice }
            : i
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.discountedPrice }];
    });

    // Auto switch to cart on mobile
    if (window.innerWidth < 768) {
      setMobileView('cart');
    }
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      return prev.reduce<CartItem[]>((acc, item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return acc; // Remove item
          if (newQty > item.product.stockQuantity) {
            toast.error(`Only ${item.product.stockQuantity} available`);
            return [...acc, item];
          }
          return [...acc, { ...item, quantity: newQty, subtotal: newQty * item.product.discountedPrice }];
        }
        return [...acc, item];
      }, []);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount('');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setPaymentMethod('CASH');
    setShowCustomerFields(false);
  }, []);

  // ─── Barcode Scanner (keyboard) ────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow typing in search bar
      if (isTyping && target !== searchRef.current) return;

      if (e.key === 'Enter' && barcodeBufferRef.current.length >= 4) {
        e.preventDefault();
        const barcode = barcodeBufferRef.current;
        barcodeBufferRef.current = '';
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        handleBarcodeScan(barcode);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBufferRef.current += e.key;
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeScan = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1000) return;
    lastScanTimeRef.current = now;

    // First check in local products
    const localMatch = products.find(p => p.barcode === barcode);
    if (localMatch) {
      addToCart(localMatch);
      toast.success(`Added: ${localMatch.name}`);
      return;
    }

    // Fallback to API
    try {
      const response = await findProductByBarcodeAction(barcode);
      if (response.success && response.data) {
        const d = response.data;
        const product: AdminProduct = {
          id: d.id,
          name: d.name,
          barcode: d.barcode,
          costPrice: d.costPrice,
          price: d.price,
          discountPercent: d.discountPercent,
          discountedPrice: d.discountedPrice,
          profit: d.profit,
          stockQuantity: d.stockQuantity,
          imageUrl: d.imageUrl,
          brandName: d.brand?.name,
          categoryName: d.category.name,
          isVariant: d.isVariant,
          parentProductId: d.parentProductId,
          hasVariants: d.hasVariants,
          variantCode: d.variantCode,
          variantColor: d.variantColor,
          variantSize: d.variantSize,
          totalVariantStock: d.totalVariantStock,
          variants: d.variants,
        };
        addToCart(product);
        toast.success(`Added: ${product.name}`);
      } else {
        toast.error('Product not found');
      }
    } catch {
      toast.error('Scan failed');
    }
  };

  // ─── Submit Sale ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Stock validation
    for (const item of cart) {
      if (item.quantity > item.product.stockQuantity) {
        toast.error(`${item.product.name}: Only ${item.product.stockQuantity} available`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const saleRequest: SaleRequest = {
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        ...(customerName.trim() && { customerName: customerName.trim() }),
        ...(customerPhone.trim() && { customerPhone: customerPhone.trim() }),
        ...(discountAmount > 0 && { discountAmount }),
        ...(notes.trim() && { notes: notes.trim() }),
      };

      const response = await createSaleAction(saleRequest);

      if (response.success && response.data) {
        setCompletedSale(response.data);
        setShowReceipt(true);
        toast.success('Sale completed!');
        clearCart();
      } else {
        toast.error(response.message || 'Failed to process sale');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Live Receipt Preview Data ──────────────────────────────────────────────

  const previewSale: Sale | null = cart.length > 0 ? {
    id: 'PREVIEW',
    customerName: customerName || undefined,
    customerPhone: customerPhone || undefined,
    items: cart.map((item, idx) => ({
      id: `preview-${idx}`,
      productId: item.product.id,
      productName: item.product.name + (item.product.isVariant ? ` ${getVariantLabel(item.product)}` : ''),
      quantity: item.quantity,
      unitPrice: item.product.discountedPrice,
      unitCost: item.product.costPrice,
      subtotal: item.subtotal,
      profit: (item.product.discountedPrice - item.product.costPrice) * item.quantity,
    })),
    totalAmount: cartTotal,
    totalCost: cart.reduce((s, i) => s + i.product.costPrice * i.quantity, 0),
    discountAmount: discountAmount || undefined,
    profit: cart.reduce((s, i) => s + (i.product.discountedPrice - i.product.costPrice) * i.quantity, 0),
    profitMargin: 0,
    paymentMethod,
    soldBy: 'Current Cashier',
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
  } : null;

  // ─── Unique Category Names ──────────────────────────────────────────────────

  const categoryNames = useMemo(() => {
    const names = new Set(products.map(p => p.categoryName));
    return Array.from(names).sort();
  }, [products]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Mobile Tab Bar ── */}
      <div className="md:hidden flex border-b bg-card">
        <button
          onClick={() => setMobileView('products')}
          className={cn(
            'flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2',
            mobileView === 'products'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <Package className="w-4 h-4 inline-block mr-1.5" />
          Products
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={cn(
            'flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2 relative',
            mobileView === 'cart'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground'
          )}
        >
          <ShoppingCart className="w-4 h-4 inline-block mr-1.5" />
          Cart
          {cartItemCount > 0 && (
            <Badge className="absolute top-1.5 right-[30%] text-[10px] px-1.5 py-0 h-5 min-w-5">
              {cartItemCount}
            </Badge>
          )}
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT PANEL — Products (hidden on mobile when cart is shown)
           ══════════════════════════════════════════════════════════════════════ */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0 border-r',
          mobileView === 'cart' ? 'hidden md:flex' : 'flex'
        )}>
          {/* ── Search + Actions Bar ── */}
          <div className="p-2 sm:p-3 border-b bg-card space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => setScannerOpen(true)}
                title="Camera Scanner"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* ── Category Pills ── */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                All
              </button>
              {categoryNames.map(name => (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                    selectedCategory === name
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Product Grid ── */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No products found</p>
                {searchTerm && (
                  <Button variant="link" size="sm" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1.5 sm:gap-2">
                  {filteredProducts.map(product => {
                    const isParent = parentIdsWithVariants.has(product.id);
                    const parentStock = isParent ? getParentTotalStock(product.id) : 0;
                    const isOutOfStock = isParent ? parentStock <= 0 : product.stockQuantity <= 0;
                    const isLowStock = !isParent && product.stockQuantity > 0 && product.stockQuantity < 10;
                    const inCart = cart.find(i => i.product.id === product.id);
                    // For parent: count total variant items in cart
                    const parentCartCount = isParent
                      ? (variantsByParent[product.id] || []).reduce((sum, v) => {
                          const c = cart.find(i => i.product.id === v.id);
                          return sum + (c ? c.quantity : 0);
                        }, 0)
                      : 0;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          if (isParent) {
                            setExpandedParent(product.id);
                          } else {
                            addToCart(product);
                          }
                        }}
                        disabled={isOutOfStock && !isParent}
                        className={cn(
                          'w-full text-left rounded-xl transition-all duration-150 overflow-hidden group relative',
                          isParent
                            ? 'bg-card border border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            : isOutOfStock
                              ? 'bg-card border opacity-50 cursor-not-allowed'
                              : 'bg-card border hover:border-primary hover:shadow-md cursor-pointer active:scale-[0.97]',
                          inCart && !isParent && 'ring-2 ring-primary border-primary',
                          isParent && parentCartCount > 0 && 'ring-2 ring-blue-500 border-blue-500'
                        )}
                      >
                        {/* Product Image */}
                        <div className="aspect-square relative bg-muted/30 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              unoptimized
                              className={cn('object-contain p-1', isOutOfStock && 'grayscale')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}

                          {/* Out of Stock Overlay */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="text-[9px] sm:text-xs font-bold text-white tracking-wide">SOLD OUT</span>
                            </div>
                          )}

                          {/* Low Stock Indicator */}
                          {isLowStock && (
                            <div className="absolute top-0.5 right-0.5 bg-orange-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full leading-none">
                              {product.stockQuantity}
                            </div>
                          )}

                          {/* In Cart Badge (regular product) */}
                          {inCart && !isParent && (
                            <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[8px] sm:text-[9px] font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md">
                              {inCart.quantity}
                            </div>
                          )}

                          {/* In Cart Badge (parent — total of all variant items) */}
                          {isParent && parentCartCount > 0 && (
                            <div className="absolute top-0.5 left-0.5 bg-blue-600 text-white text-[8px] sm:text-[9px] font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md">
                              {parentCartCount}
                            </div>
                          )}

                          {/* Discount Badge */}
                          {product.discountPercent > 0 && !isOutOfStock && !isParent && (
                            <div className="absolute bottom-0.5 left-0.5 bg-red-500 text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded leading-none">
                              -{product.discountPercent}%
                            </div>
                          )}

                          {/* Variants Banner */}
                          {isParent && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/95 to-blue-600/80 text-white text-[8px] sm:text-[9px] font-semibold px-1.5 py-1 flex items-center justify-center gap-1">
                              <GitBranch className="w-2.5 h-2.5" />
                              {variantsByParent[product.id]?.length || '?'} variants
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-1.5 sm:p-2">
                          <p className="text-[10px] sm:text-xs font-medium line-clamp-2 leading-tight min-h-[24px] sm:min-h-[28px]">
                            {product.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs sm:text-sm font-bold text-primary">
                              {formatUSD(product.discountedPrice)}
                            </span>
                            {!isParent && !isOutOfStock && (
                              <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                {product.stockQuantity}
                              </span>
                            )}
                            {isParent && (
                              <span className="text-[9px] sm:text-[10px] text-blue-600 font-medium">
                                Σ{parentStock}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Product Count */}
                <p className="text-center text-xs text-muted-foreground py-2">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT PANEL — Cart + Checkout (hidden on mobile when products shown)
           ══════════════════════════════════════════════════════════════════════ */}
        <div className={cn(
          'flex flex-col bg-card',
          mobileView === 'products' ? 'hidden md:flex' : 'flex',
          'w-full md:w-[340px] lg:w-[360px] xl:w-[380px] md:flex-shrink-0'
        )}>
          {/* ── Cart Header ── */}
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="font-semibold text-sm">Cart</span>
              {cartItemCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={clearCart}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* ── Cart Items ── */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                <ShoppingCart className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs mt-1">Tap products to add them</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item.product.id} className="p-2.5 sm:p-3 flex gap-2.5 hover:bg-muted/30 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 relative rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                      {item.product.imageUrl ? (
                        <Image src={item.product.imageUrl} alt={item.product.name} fill unoptimized className="object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{item.product.name}</p>
                      {item.product.isVariant && (
                        <p className="text-[10px] text-blue-600 font-medium">{getVariantLabel(item.product)}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-0 border rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 h-7 flex items-center justify-center text-xs font-bold border-x bg-muted/30">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Subtotal */}
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-bold">{formatUSD(item.subtotal)}</p>
                          {item.quantity > 1 && (
                            <p className="text-[9px] text-muted-foreground">{formatUSD(item.product.discountedPrice)} each</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="self-start p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Checkout Section ── */}
          {cart.length > 0 && (
            <div className="border-t bg-card">
              {/* Customer Info Toggle */}
              <div className="px-3 pt-2.5">
                <button
                  onClick={() => setShowCustomerFields(!showCustomerFields)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <User className="w-3 h-3" />
                  <span>Customer info & notes</span>
                  <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform', showCustomerFields && 'rotate-90')} />
                </button>
                
                {showCustomerFields && (
                  <div className="mt-2 space-y-1.5">
                    <Input
                      placeholder="Customer name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Phone number"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Notes"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="px-3 pt-2.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Payment</p>
                <div className="grid grid-cols-5 gap-1">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.value}
                        onClick={() => setPaymentMethod(pm.value)}
                        className={cn(
                          'flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg text-[9px] sm:text-[10px] font-medium transition-all border',
                          paymentMethod === pm.value
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-accent border-transparent'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="px-3 pt-2.5 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal ({cartItemCount} items)</span>
                  <span>{formatUSD(cartSubtotal)}</span>
                </div>
                
                {/* Discount Input */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    <span>Discount</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    className="h-7 text-xs text-right w-24 ml-auto"
                  />
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-red-500 font-medium">
                    <span>Discount</span>
                    <span>-{formatUSD(discountAmount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center font-bold text-lg py-1">
                  <span>Total</span>
                  <span className="text-primary">{formatUSD(cartTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                  title={showReceiptPreview ? 'Hide receipt preview' : 'Show receipt preview'}
                >
                  {showReceiptPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  className="flex-1 h-10 text-sm font-semibold"
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Complete Sale · {formatUSD(cartTotal)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            FAR RIGHT PANEL — Receipt Preview (desktop only)
           ══════════════════════════════════════════════════════════════════════ */}
        {showReceiptPreview && cart.length > 0 && (
          <div className="hidden xl:flex flex-col w-[340px] flex-shrink-0 border-l bg-muted/20">
            <div className="p-3 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <ReceiptIcon className="w-4 h-4" />
                <span className="font-semibold text-sm">Receipt Preview</span>
              </div>
              <Badge variant="outline" className="text-[10px]">LIVE</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex justify-center">
              {previewSale && (
                <div className="transform scale-[0.85] origin-top">
                  <ReceiptPreview sale={previewSale} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Cart FAB ── */}
      {mobileView === 'products' && cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 px-5 gap-2"
            onClick={() => setMobileView('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold">{cartItemCount}</span>
            <Separator orientation="vertical" className="h-5 bg-primary-foreground/30" />
            <span className="font-bold">{formatUSD(cartTotal)}</span>
          </Button>
        </div>
      )}

      {/* ── Variant Picker Overlay ── */}
      {expandedParent && (() => {
        const parentProduct = products.find(p => p.id === expandedParent);
        const variants = variantsByParent[expandedParent] || [];
        if (!parentProduct) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setExpandedParent(null)}
            />

            {/* Panel */}
            <div className="relative w-full sm:max-w-lg md:max-w-2xl max-h-[85vh] sm:max-h-[80vh] bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 sm:mx-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b bg-card">
                <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-muted/30 flex-shrink-0 border">
                  {parentProduct.imageUrl ? (
                    <Image src={parentProduct.imageUrl} alt={parentProduct.name} fill unoptimized className="object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg truncate">{parentProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
                      <GitBranch className="w-3 h-3 mr-0.5" />
                      {variants.length} variants
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Σ{getParentTotalStock(expandedParent)} in stock
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedParent(null)}
                  className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Variant Grid */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                  {variants.map(variant => {
                    const vLabel = getVariantLabel(variant);
                    const vOutOfStock = variant.stockQuantity <= 0;
                    const vInCart = cart.find(i => i.product.id === variant.id);

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          addToCart(variant);
                        }}
                        disabled={vOutOfStock}
                        className={cn(
                          'relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                          vOutOfStock
                            ? 'opacity-50 cursor-not-allowed bg-muted/20 border-muted'
                            : 'bg-card hover:bg-accent/50 hover:border-primary hover:shadow-md cursor-pointer active:scale-[0.98]',
                          vInCart && 'ring-2 ring-primary border-primary bg-primary/5'
                        )}
                      >
                        {/* Variant Image */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                          {variant.imageUrl ? (
                            <Image
                              src={variant.imageUrl}
                              alt={vLabel || variant.name}
                              fill
                              unoptimized
                              className={cn('object-contain p-0.5', vOutOfStock && 'grayscale')}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground/20" />
                            </div>
                          )}
                          {vOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">OUT</span>
                            </div>
                          )}
                        </div>

                        {/* Variant Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{vLabel || 'Variant'}</p>
                          <p className="text-sm font-bold text-primary mt-0.5">{formatUSD(variant.discountedPrice)}</p>
                          <p className={cn(
                            'text-[11px] mt-0.5',
                            vOutOfStock ? 'text-destructive font-medium' : 'text-muted-foreground'
                          )}>
                            {vOutOfStock ? 'Out of stock' : `${variant.stockQuantity} in stock`}
                          </p>
                        </div>

                        {/* Cart Quantity / Add Icon */}
                        <div className="flex-shrink-0">
                          {vInCart ? (
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
                              {vInCart.quantity}
                            </div>
                          ) : !vOutOfStock ? (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {variants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No variants found</p>
                  </div>
                )}
              </div>

              {/* Footer with cart summary for this parent */}
              {(() => {
                const parentCartItems = variants
                  .map(v => cart.find(i => i.product.id === v.id))
                  .filter(Boolean) as CartItem[];
                const totalQty = parentCartItems.reduce((s, i) => s + i.quantity, 0);
                const totalAmt = parentCartItems.reduce((s, i) => s + i.subtotal, 0);

                if (totalQty === 0) return null;

                return (
                  <div className="border-t bg-card p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        {totalQty} item{totalQty !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">{formatUSD(totalAmt)}</span>
                      <Button size="sm" onClick={() => setExpandedParent(null)}>
                        <Check className="w-4 h-4 mr-1" />
                        Done
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ── Barcode Scanner Dialog ── */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(barcode) => {
          setScannerOpen(false);
          handleBarcodeScan(barcode);
        }}
      />

      {/* ── Receipt Dialog (after sale completes) ── */}
      <ReceiptDialog
        open={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setCompletedSale(null);
        }}
        sale={completedSale}
      />
    </div>
  );
}

// ─── Receipt Preview Component (inline, no Tailwind for html2canvas compat) ──

function ReceiptPreview({ sale }: { sale: Sale }) {
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const fmtDate = (s: string) =>
    new Date(s).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div
      style={{
        width: '300px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Courier New', Consolas, monospace",
        fontSize: '12px',
        lineHeight: '1.5',
        padding: '24px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Store Header */}
      <div style={{ textAlign: 'center', paddingBottom: '12px', marginBottom: '12px', borderBottom: '2px solid #000' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>Rolly Shop</div>
        <div style={{ fontSize: '10px', color: '#6b7280' }}>RECEIPT PREVIEW</div>
      </div>

      {/* Info */}
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Date:</span>
          <span>{fmtDate(sale.createdAt)}</span>
        </div>
        {sale.customerName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span>Customer:</span>
            <span>{sale.customerName}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Payment:</span>
          <span style={{ fontWeight: 700 }}>{sale.paymentMethod}</span>
        </div>
      </div>

      {/* Separator */}
      <div style={{ borderTop: '1px dashed #9ca3af', marginBottom: '8px' }} />

      {/* Items */}
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '4px 2px', fontWeight: 700 }}>Item</th>
            <th style={{ textAlign: 'center', padding: '4px 2px', fontWeight: 700, width: '28px' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '4px 2px', fontWeight: 700, width: '50px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '4px 2px', wordBreak: 'break-word' }}>{item.productName}</td>
              <td style={{ padding: '4px 2px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '4px 2px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop: '1px solid #000', paddingTop: '8px' }}>
        {sale.discountAmount != null && sale.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#dc2626', padding: '2px 0' }}>
            <span>Discount</span>
            <span>-{fmt(sale.discountAmount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', marginTop: '4px' }}>
          <span>TOTAL</span>
          <span>{fmt(sale.totalAmount)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #9ca3af', fontSize: '10px', color: '#6b7280' }}>
        <div style={{ fontWeight: 600, color: '#000' }}>Thank You!</div>
        <div>Items: {sale.items.length} · {sale.items.reduce((s, i) => s + i.quantity, 0)} units</div>
      </div>
    </div>
  );
}
