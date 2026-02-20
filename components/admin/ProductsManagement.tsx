'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Plus, Pencil, Trash2, Search, Filter, DollarSign, Box, TrendingUp, X, Tag, Layers, ShoppingBag, Sparkles, AlertTriangle, TrendingDown, Eye, Minus, Download, Keyboard, History, ImageIcon, ChevronLeft, ChevronRight, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import type { AdminProduct, ProductRequest, InventoryStats, ProductVariant } from '@/types/product.types';
import type { Brand } from '@/types/brand.types';
import type { Category } from '@/types/category.types';
import { 
  createProductAction, 
  updateProductAction, 
  deleteProductAction,
  fetchInventoryStatsAction,
  fetchLowStockProductsAction,
  fetchAdminProductsAction,
  fetchAdminProductDetailAction,
  fetchProductVariantsAction,
} from '@/actions/products/products.action';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import BarcodeScanner from './BarcodeScanner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getStockBadgeClasses, getStockLevelInfo, SMART_FILTER_PRESETS, getActiveSmartFilters } from '@/lib/stock-utils';
import { SmartFilterDropdown } from './SmartFilterDropdown';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { StockHistoryDialog } from './StockHistoryDialog';
import { MultiImageUpload } from './MultiImageUpload';
import { exportProducts } from '@/services/products.service';
import ProductsByCategory from './ProductsByCategory';
import { ProductCardSkeletonGrid } from '@/components/skeletons';
import { formatUSD, formatKHR } from '@/lib/currency';

type ProductFormData = {
  name: string;
  description: string;
  barcode: string;
  costPrice: string;
  price: string;
  discountPercent: string;
  stockQuantity: string;
  imageUrl: string;
  categoryId: string;
  // Variant fields
  isVariant: boolean;
  parentProductId: string;
  variantCode: string;
  variantColor: string;
  variantSize: string;
  useCustomPrice: boolean;
};

interface ProductsManagementProps {
  initialProducts: AdminProduct[];
  categories: Category[];
}

export default function ProductsManagement({ initialProducts, categories }: ProductsManagementProps) {
  const { data: session } = useSession();
  
  console.log('🎨 ProductsManagement rendered with:', {
    productsCount: initialProducts.length,
    categoriesCount: categories.length,
    products: initialProducts,
    hasSession: !!session,
    hasToken: !!session?.backendToken
  });

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState(initialProducts.length);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<AdminProduct[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'category'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // New feature dialogs
  const [stockHistoryDialog, setStockHistoryDialog] = useState<{
    open: boolean;
    productId: string | null;
    productName: string;
    currentStock: number;
  }>({ open: false, productId: null, productName: '', currentStock: 0 });
  
  const [multiImageDialog, setMultiImageDialog] = useState<{
    open: boolean;
    productId: string | null;
    productName: string;
  }>({ open: false, productId: null, productName: '' });
  
  const [isExporting, setIsExporting] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    barcode: '',
    costPrice: '',
    price: '',
    discountPercent: '',
    stockQuantity: '',
    imageUrl: '',
    categoryId: '',
    isVariant: false,
    parentProductId: '',
    variantCode: '',
    variantColor: '',
    variantSize: '',
    useCustomPrice: false,
  });

  // Variant expansion state for product list
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [variantsCache, setVariantsCache] = useState<Record<string, ProductVariant[]>>({});
  const [loadingVariants, setLoadingVariants] = useState<Set<string>>(new Set());

  // Parent products for variant creation (non-variant products)
  const parentProductOptions = products.filter(p => !p.isVariant);

  // Helper: get effective stock for display (totalVariantStock for parents, stockQuantity otherwise)
  const getEffectiveStock = (product: AdminProduct): number => {
    if (product.hasVariants && product.totalVariantStock != null) {
      return product.totalVariantStock;
    }
    return product.stockQuantity;
  };

  const toggleExpandParent = async (productId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
      // If the product already has inline variants from API, skip the fetch
      const product = products.find(p => p.id === productId);
      if (!product?.variants?.length && !variantsCache[productId]) {
        setLoadingVariants(prev => new Set(prev).add(productId));
        try {
          const res = await fetchProductVariantsAction(productId);
          if (res.success && res.data) {
            setVariantsCache(prev => ({ ...prev, [productId]: res.data! }));
          }
        } catch { /* silent */ }
        setLoadingVariants(prev => {
          const s = new Set(prev);
          s.delete(productId);
          return s;
        });
      }
    }
    setExpandedParents(newExpanded);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products from backend with filters
  const loadProducts = async () => {
    if (!session?.backendToken) return;
    
    setIsFetchingProducts(true);
    try {
      const response = await fetchAdminProductsAction(
        currentPage,
        pageSize,
        'createdAt',
        'desc',
        filterCategory !== 'all' ? filterCategory : undefined,
        debouncedSearch || undefined
      );
      
      if (response.success && response.data) {
        setProducts(response.data.content);
        setTotalProducts(response.data.totalElements);
      } else {
        toast.error('បរាជ័យក្នុងការផ្ទុកផលិតផល');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('បរាជ័យក្នុងការផ្ទុកផលិតផល');
    } finally {
      setIsFetchingProducts(false);
    }
  };

  // Reload products when filters change
  useEffect(() => {
    loadProducts();
  }, [filterCategory, debouncedSearch, currentPage]);

  // Fetch inventory stats
  useEffect(() => {
    const loadInventoryStats = async () => {
      try {
        const response = await fetchInventoryStatsAction(lowStockThreshold);
        if (response.success && response.data) {
          setInventoryStats(response.data);
        } else {
          console.log('⚠️ Inventory stats not available:', response.message);
          // Silently fail - stats will show local calculations as fallback
        }
      } catch (error) {
        console.error('❌ Error loading inventory stats:', error);
        // Silently fail - stats will show local calculations as fallback
      }
    };
    
    loadInventoryStats();
  }, [products, lowStockThreshold]);

  // Load low stock products when requested
  const loadLowStockProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetchLowStockProductsAction(lowStockThreshold, 0, 50);
      if (response.success && response.data?.content) {
        setLowStockProducts(response.data.content);
        setShowLowStock(true);
      } else {
        // If backend endpoint not available, fallback to local filtering
        const localLowStock = products.filter(p => p.stockQuantity <= lowStockThreshold);
        if (localLowStock.length > 0) {
          setLowStockProducts(localLowStock);
          setShowLowStock(true);
          toast.info(`បង្ហាញ ${localLowStock.length} ផលិតផលស្តុកទាប (តម្រងក្នុងម៉ាស៊ីន)`);
        } else {
          toast.error('Endpoint មិនអាចប្រើបាន។ សូមធ្វើបច្ចុប្បន្នភាព backend។');
        }
      }
    } catch (error) {
      console.error('❌ Error loading low stock products:', error);
      toast.error('បរាជ័យក្នុងការផ្ទុកផលិតផលស្តុកទាប។');
    }
    setIsLoading(false);
  };

  // File upload handler
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      if (!session?.backendToken) {
        toast.error('ត្រូវការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ');
        throw new Error('No authentication token');
      }

      toast.info('កំពុងបង្ហោះរូបភាព... 📤');
      const response = await uploadFileAction(file, session.backendToken);
      
      if (response.success && response.data?.url) {
        toast.success('រូបភាពបានបង្ហោះដោយជោគជ័យ! ✅');
        return response.data.url;
      } else {
        toast.error(response.message || 'បរាជ័យក្នុងការបង្ហោះរូបភាព');
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('បរាជ័យក្នុងការបង្ហោះរូបភាព។ សូមព្យាយាមម្តងទៀត។');
      throw error;
    }
  };

  // Barcode scan handler
  const handleBarcodeScanned = (barcode: string) => {
    console.log('📱 Barcode scanned:', barcode);
    setFormData({ ...formData, barcode });
    toast.success(`បានទទួលបាកូដ: ${barcode}`);
    setScannerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imageUrl) {
      toast.error('សូមបង្ហោះរូបភាពផលិតផល');
      return;
    }

    const costPrice = parseFloat(formData.costPrice) || 0;
    const price = parseFloat(formData.price) || 0;
    const discountPercent = parseInt(formData.discountPercent) || 0;
    const stockQuantity = parseInt(formData.stockQuantity) || 0;

    if (costPrice >= price) {
      toast.error('តម្លៃលក់ត្រូវតែធំជាងតម្លៃដើម!');
      return;
    }

    if (price <= 0) {
      toast.error('តម្លៃលក់ត្រូវតែធំជាង 0!');
      return;
    }

    setIsLoading(true);

    try {
      const productRequest: ProductRequest = {
        name: formData.name,
        description: formData.description,
        barcode: formData.barcode || undefined,
        costPrice,
        price,
        discountPercent,
        stockQuantity,
        imageUrl: formData.imageUrl,
        categoryId: formData.categoryId,
        ...(formData.isVariant && {
          isVariant: true,
          parentProductId: formData.parentProductId || undefined,
          variantCode: formData.variantCode || undefined,
          variantColor: formData.variantColor || undefined,
          variantSize: formData.variantSize || undefined,
        }),
      };

      if (editingProduct) {
        const response = await updateProductAction(editingProduct.id, productRequest);
        
        if (response.success && response.data) {
          const d = response.data!;
          // Bust browser image cache by appending timestamp
          const imgUrl = d.imageUrl?.includes('?')
            ? `${d.imageUrl}&t=${Date.now()}`
            : `${d.imageUrl}?t=${Date.now()}`;

          const updated: AdminProduct = {
            id: d.id,
            name: d.name,
            costPrice: d.costPrice,
            price: d.price,
            discountPercent: d.discountPercent,
            discountedPrice: d.discountedPrice,
            profit: d.profit,
            stockQuantity: d.stockQuantity,
            imageUrl: imgUrl,
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

          // Functional updater to avoid stale closure
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
          toast.success('ផលិតផលបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ! 🎉');
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពផលិតផល');
        }
      } else {
        const response = await createProductAction(productRequest);
        
        if (response.success && response.data) {
          const d = response.data!;
          const newProduct: AdminProduct = {
            id: d.id,
            name: d.name,
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
          setProducts((prev) => [newProduct, ...prev]);
          toast.success('ផលិតផលបានបង្កើតដោយជោគជ័យ! 🎉');
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការបង្កើតផលិតផល');
        }
      }
      
      resetForm();
    } catch (error) {
      toast.error('មានកំហុសមិនរំពឹងទុកកើតឡើង។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    if (editingProduct) {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        barcode: '',
        costPrice: '',
        price: '',
        discountPercent: '',
        stockQuantity: '',
        imageUrl: '',
        categoryId: '',
        isVariant: false,
        parentProductId: '',
        variantCode: '',
        variantColor: '',
        variantSize: '',
        useCustomPrice: false,
      });
    }
    setDialogOpen(true);
  };

  const handleEdit = async (product: AdminProduct) => {
    setEditingProduct(product);
    const categoryId = categories.find(c => c.name === product.categoryName)?.id || '';

    setFormData({
      name: product.name,
      description: '',
      barcode: product.barcode || '',
      costPrice: product.costPrice.toString(),
      price: product.price.toString(),
      discountPercent: product.discountPercent.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl,
      categoryId,
      isVariant: product.isVariant || false,
      parentProductId: product.parentProductId || '',
      variantCode: product.variantCode || '',
      variantColor: product.variantColor || '',
      variantSize: product.variantSize || '',
      useCustomPrice: product.isVariant || false,
    });
    setDialogOpen(true);

    try {
      const res = await fetchAdminProductDetailAction(product.id);
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          description: res.data!.description || '',
          categoryId: res.data!.category?.id || prev.categoryId,
        }));
      }
    } catch {
      // silent
    }
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, productId: id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.productId) {
      setIsLoading(true);
      try {
        const response = await deleteProductAction(deleteDialog.productId);
        
        if (response.success) {
          setProducts(products.filter(p => p.id !== deleteDialog.productId));
          toast.success('ផលិតផលបានលុបដោយជោគជ័យ! 🗑️');
        } else {
          toast.error(response.message || 'បរាជ័យក្នុងការលុបផលិតផល');
        }
      } catch (error) {
        toast.error('មានកំហុសមិនរំពឹងទុកកើតឡើង។ សូមព្យាយាមម្តងទៀត។');
      } finally {
        setIsLoading(false);
      }
    }
    setDeleteDialog({ open: false, productId: null });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      barcode: '',
      costPrice: '',
      price: '',
      discountPercent: '',
      stockQuantity: '',
      imageUrl: '',
      categoryId: '',
      isVariant: false,
      parentProductId: '',
      variantCode: '',
      variantColor: '',
      variantSize: '',
      useCustomPrice: false,
    });
    setDialogOpen(false);
    setEditingProduct(null);
  };

  // Stock History handlers
  const handleOpenStockHistory = (product: AdminProduct) => {
    setStockHistoryDialog({
      open: true,
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
    });
  };

  const handleStockAdjusted = async () => {
    // Refresh products list after stock adjustment
    window.location.reload();
  };

  // Multi-Image handlers
  const handleOpenMultiImage = (product: AdminProduct) => {
    setMultiImageDialog({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  const handleImagesUpdated = async () => {
    // Refresh products list after image changes
    window.location.reload();
  };

  // Export handler
  const handleExport = async (format: 'csv' | 'excel') => {
    if (!session?.backendToken) {
      toast.error('ត្រូវការផ្ទៀងផ្ទាត់អត្តសញ្ញាណ');
      return;
    }

    setIsExporting(true);
    try {
      const filters = {
        categoryId: filterCategory !== 'all' ? filterCategory : undefined,
        search: searchTerm || undefined,
      };

      const response = await exportProducts(format, session.backendToken, filters);

      if (response.success) {
        toast.success(`ផលិតផលបាននាំចេញដោយជោគជ័យ (${format.toUpperCase()})!`);
      } else {
        toast.error(response.message || 'បរាជ័យក្នុងការនាំចេញផលិតផល');
      }
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('បរាជ័យក្នុងការនាំចេញផលិតផល');
    } finally {
      setIsExporting(false);
    }
  };

  // Products are already filtered by backend, no need for frontend filtering
  const filteredProducts = products;

  const activeFiltersCount = (searchTerm ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0);
  
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setCurrentPage(0);
  };

  const getActiveCategoryName = () => categories.find(c => c.id === filterCategory)?.name || '';

  const totalValue = products.reduce((sum, p) => sum + (p.discountedPrice * getEffectiveStock(p)), 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.profit * getEffectiveStock(p)), 0);
  const avgPrice = products.length > 0 ? (products.reduce((sum, p) => sum + p.discountedPrice, 0) / products.length) : 0;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: () => searchInputRef.current?.focus(),
      description: 'Focus search',
    },
    {
      key: 'n',
      ctrl: true,
      callback: () => handleOpenDialog(),
      description: 'New product',
    },
    {
      key: 'Escape',
      callback: () => {
        if (dialogOpen) setDialogOpen(false);
        if (scannerOpen) setScannerOpen(false);
      },
      description: 'Close dialogs',
    },
  ]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    if (!confirm(`លុប ${selectedProducts.size} ផលិតផល? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។`)) {
      return;
    }

    setIsLoading(true);
    try {
      const promises = Array.from(selectedProducts).map(id => deleteProductAction(id));
      await Promise.all(promises);
      
      setProducts(products.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
      toast.success(`${selectedProducts.size} ផលិតផលបានលុបដោយជោគជ័យ!`);
    } catch (error) {
      toast.error('បរាជ័យក្នុងការលុបផលិតផលមួយចំនួន');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Product Button */}
      <div className="flex justify-end">
        <Button size="lg" className="shadow-lg" onClick={handleOpenDialog}>
          <Plus className="w-5 h-5 mr-2" />
          បន្ថែមផលិតផល
        </Button>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingProduct ? 'កែសម្រួលផលិតផល' : 'បង្កើតផលិតផលថ្មី'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មានផលិតផលខាងក្រោម' : 'បំពេញព័ត៌មានលម្អិតដើម្បីបន្ថែមផលិតផលថ្មីទៅក្នុងស្តុក'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                {/* ── Variant Toggle (top of form) ── */}
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <input
                    type="checkbox"
                    id="isVariant"
                    checked={formData.isVariant}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        isVariant: checked,
                        parentProductId: '',
                        variantCode: '',
                        variantColor: '',
                        variantSize: '',
                        useCustomPrice: false,
                        ...(checked ? { name: '', costPrice: '', price: '', discountPercent: '', categoryId: '', description: '' } : {}),
                      });
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isVariant" className="flex items-center gap-2 cursor-pointer">
                    <GitBranch className="w-4 h-4" />
                    នេះជាបំរែបំរួលនៃផលិតផលដែលមានស្រាប់
                  </Label>
                </div>

                {/* ── Variant Config: parent + attributes ── */}
                {formData.isVariant && (
                  <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 space-y-4">
                    <div className="space-y-2">
                      <Label>ផលិតផលមេ *</Label>
                      <Select
                        value={formData.parentProductId}
                        onValueChange={(parentId) => {
                          const parent = parentProductOptions.find(p => p.id === parentId);
                          if (parent) {
                            const parentCategoryId = categories.find(c => c.name === parent.categoryName)?.id || '';
                            setFormData({
                              ...formData,
                              parentProductId: parentId,
                              name: parent.name,
                              categoryId: parentCategoryId,
                              ...(formData.useCustomPrice ? {} : {
                                costPrice: parent.costPrice.toString(),
                                price: parent.price.toString(),
                                discountPercent: parent.discountPercent.toString(),
                              }),
                            });
                          } else {
                            setFormData({ ...formData, parentProductId: parentId });
                          }
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ជ្រើសរើសផលិតផលមេ" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentProductOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — ${p.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.parentProductId && (
                      <>
                        {/* Auto-filled info banner */}
                        {(() => {
                          const parent = parentProductOptions.find(p => p.id === formData.parentProductId);
                          return parent ? (
                            <div className="flex items-center gap-3 p-3 bg-blue-100/60 dark:bg-blue-900/30 rounded-lg text-sm">
                              <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{parent.name}</span>
                                <span className="text-muted-foreground"> — {parent.categoryName} — ${parent.price.toFixed(2)}</span>
                              </div>
                            </div>
                          ) : null;
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>កូដបំរែបំរួល</Label>
                            <Input
                              value={formData.variantCode}
                              onChange={(e) => setFormData({ ...formData, variantCode: e.target.value })}
                              placeholder="ឧ. 21, 23"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ពណ៌បំរែបំរួល</Label>
                            <Input
                              value={formData.variantColor}
                              onChange={(e) => setFormData({ ...formData, variantColor: e.target.value })}
                              placeholder="ឧ. Blonde, Brown"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ទំហំបំរែបំរួល</Label>
                            <Input
                              value={formData.variantSize}
                              onChange={(e) => setFormData({ ...formData, variantSize: e.target.value })}
                              placeholder="ឧ. ធំ, តូច"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name — auto-filled for variants but editable */}
                  <div className="space-y-2">
                    <Label htmlFor="name">ឈ្មោះផលិតផល *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={formData.isVariant ? 'ទទួលពីផលិតផលមេ' : 'បញ្ចូលឈ្មោះផលិតផល'}
                      required
                      disabled={formData.isVariant && !!formData.parentProductId}
                    />
                    {formData.isVariant && formData.parentProductId && (
                      <p className="text-xs text-blue-600">បំពេញស្វ័យប្រវត្តិពីផលិតផលមេ</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">បាកូដ (ស្រេចចិត្ត)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="ស្កេន ឬបញ្ចូលបាកូដ"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setScannerOpen(true)}
                        title="ស្កេនបាកូដ"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description — optional for variants */}
                  {(!formData.isVariant || formData.description) && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">ការពិពណ៌នា {formData.isVariant ? '(ស្រេចចិត្ត)' : ''}</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={formData.isVariant ? 'ទុកទទេដើម្បីប្រើការពិពណ៌នាផលិតផលមេ' : 'ការពិពណ៌នាខ្លី'}
                      />
                    </div>
                  )}

                  {/* Category — auto-filled & disabled for variants */}
                  <div className="space-y-2">
                    <Label htmlFor="category">ប្រភេទ *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      required
                      disabled={isLoading || (formData.isVariant && !!formData.parentProductId)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ជ្រើសរើសប្រភេទ" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.isVariant && formData.parentProductId && (
                      <p className="text-xs text-blue-600">ដូចគ្នានឹងផលិតផលមេ</p>
                    )}
                  </div>

                  {/* Stock — always required */}
                  <div className="space-y-2">
                    <Label htmlFor="stock">បរិមាណស្តុក *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      placeholder="បញ្ចូលបរិមាណ"
                      required
                    />
                  </div>

                  {/* ── Price Section ── */}
                  {formData.isVariant && formData.parentProductId && !formData.useCustomPrice ? (
                    /* Variant using parent price — show summary + toggle */
                    <div className="md:col-span-2 p-4 border rounded-lg bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">តម្លៃ: ដូចផលិតផលមេ</p>
                          <p className="text-xs text-muted-foreground">
                            Cost ${formData.costPrice || '0.00'} → Sell ${formData.price || '0.00'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, useCustomPrice: true })}
                        >
                          <Pencil className="w-3 h-3 mr-1.5" />
                          តម្លៃផ្ទាល់ខ្លួន
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Regular product OR variant with custom price */
                    <>
                      {formData.isVariant && formData.useCustomPrice && (
                        <div className="md:col-span-2 flex items-center justify-between p-3 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">បើកតម្លៃផ្ទាល់ខ្លួនសម្រាប់បំរែបំរួលនេះ</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const parent = parentProductOptions.find(p => p.id === formData.parentProductId);
                              setFormData({
                                ...formData,
                                useCustomPrice: false,
                                costPrice: parent?.costPrice.toString() || formData.costPrice,
                                price: parent?.price.toString() || formData.price,
                                discountPercent: parent?.discountPercent.toString() || formData.discountPercent,
                              });
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            ប្រើតម្លៃផលិតផលមេ
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="costPrice">តម្លៃដើម ($) *</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.costPrice}
                          onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                          placeholder="តម្លៃដែលអ្នកទិញ"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">តម្លៃលក់ ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="តម្លៃអតិថិជនបង់"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discount">បញ្ចុះតម្លៃ (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discountPercent}
                          onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                          placeholder="0"
                        />
                      </div>

                      {(parseFloat(formData.costPrice) > 0 && parseFloat(formData.price) > 0) && (
                        <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">ប្រាក់ចំណេញប៉ាន់ស្មាន:</span>
                            <span className={`text-lg font-bold ${parseFloat(formData.price) > parseFloat(formData.costPrice) ? 'text-green-600' : 'text-red-600'}`}>
                              ${(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Product Image — always required */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>រូបភាពផលិតផល *</Label>
                    <ImageUpload
                      value={formData.imageUrl}
                      onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                      showUrlInput={false}
                      onFileSelect={handleFileUpload}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                    បោះបង់
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'កំពុងរក្សាទុក...' : (editingProduct ? 'ធ្វើបច្ចុប្បន្នភាពផលិតផល' : 'បង្កើតផលិតផល')}
                  </Button>
                </DialogFooter>
              </form>
        </DialogContent>
      </Dialog>

      {/* Inventory Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ផលិតផលសរុប</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventoryStats?.totalProducts ?? products.length}
              </div>
              <p className="text-xs text-muted-foreground">ផលិតផលទាំងអស់</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">តម្លៃស្តុក</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(inventoryStats?.totalValue ?? totalValue).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
              <p className="text-xs text-muted-foreground">តម្លៃដើម × ស្តុក</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ប្រាក់ចំណេញសក្តានុពល 💰</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(inventoryStats?.totalPotentialProfit ?? totalProfit).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
              <p className="text-xs text-muted-foreground">ប្រាក់ចំណូលសក្តានុពល</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200 dark:border-amber-800"
            onClick={loadLowStockProducts}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ស្តុកទាប ⚠️</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {inventoryStats?.lowStockCount ?? products.filter(p => getEffectiveStock(p) < lowStockThreshold).length}
              </div>
              <p className="text-xs text-muted-foreground">
                ត្រូវការបញ្ចូលស្តុក (≤{lowStockThreshold}) - ចុចដើម្បីមើល
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Products Alert */}
        {showLowStock && lowStockProducts.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <CardTitle className="text-amber-900 dark:text-amber-100">
                      ការជូនដំណឹងស្តុកទាប 📦
                    </CardTitle>
                    <CardDescription className="text-amber-700 dark:text-amber-300">
                      {lowStockProducts.length} ផលិតផលត្រូវការបញ្ចូលស្តុក
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLowStock(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={product.stockQuantity === 0 ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {product.stockQuantity === 0 ? (
                                <>អស់ពីស្តុក</>
                              ) : (
                                <>{product.stockQuantity} នៅសល់</>
                              )}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ${product.discountedPrice}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters - Enhanced */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">តម្រង</CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({filteredProducts.length} នៃ {products.length})
                </span>
                {selectedProducts.size > 0 && (
                  <Badge variant="secondary">
                    {selectedProducts.size} បានជ្រើសរើស
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedProducts.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    លុបដែលបានជ្រើសរើស ({selectedProducts.size})
                  </Button>
                )}
                
                {/* Export Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting || products.length === 0}
                  className="h-8"
                >
                  <Download className="w-3 h-3 mr-1" />
                  នាំចេញ CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting || products.length === 0}
                  className="h-8"
                >
                  <Download className="w-3 h-3 mr-1" />
                  នាំចេញ Excel
                </Button>
                
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 text-xs"
                  >
                    សម្អាតទាំងអស់
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar with Keyboard Hint */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="ស្វែងរកផលិតផល... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <Keyboard className="w-3 h-3" />
                </kbd>
              </div>
            </div>

            {/* Filters Grid */}
            <div className="space-y-3">
              {/* Category - Horizontal Scrolling */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ប្រភេទ</Label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                  <Button
                    variant={filterCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFilterCategory('all');
                      setCurrentPage(0);
                    }}
                    className="flex-shrink-0 snap-start"
                  >
                    ប្រភេទទាំងអស់
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={filterCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFilterCategory(category.id);
                        setCurrentPage(0);
                      }}
                      className="flex-shrink-0 snap-start"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    <Search className="w-3 h-3" />
                    {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-accent rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="w-3 h-3" />
                    {getActiveCategoryName()}
                    <button
                      onClick={() => setFilterCategory('all')}
                      className="ml-1 hover:bg-accent rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products View - Grid or Table */}
        {isFetchingProducts ? (
          <ProductCardSkeletonGrid count={pageSize} />
        ) : filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const effectiveStock = getEffectiveStock(product);
              const stockInfo = getStockLevelInfo(effectiveStock);
              const profitMargin = product.price > 0 ? ((product.profit / product.price) * 100) : 0;
              
              return (
                <Card 
                  key={product.id} 
                  className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-primary/50"
                >
                  {/* Product Image */}
                  <div className="relative h-32 sm:h-40 md:h-48 bg-muted/30 overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {product.discountPercent > 0 && (
                      <Badge className="absolute top-1 left-1 text-[10px] sm:text-xs bg-red-500 text-white border-0 shadow-md px-1.5 py-0.5">
                        -{product.discountPercent}%
                      </Badge>
                    )}
                    
                    {/* Stock Badge */}
                    <Badge 
                      className={cn(
                        "absolute top-1 right-1 text-[10px] sm:text-xs shadow-md px-1.5 py-0.5",
                        getStockBadgeClasses(effectiveStock)
                      )}
                    >
                      {product.hasVariants ? `Σ${effectiveStock}` : effectiveStock}
                    </Badge>

                    {/* Quick Actions on Hover - Hidden on Mobile */}
                    <div className="hidden sm:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                      <Link href={`/products/${product.id}`}>
                        <Button size="sm" variant="secondary">
                          <Eye className="w-3 h-3 mr-1" />
                          មើល
                        </Button>
                      </Link>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(product)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                    {/* Product Name */}
                    <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 min-h-[32px] sm:min-h-[40px]" title={product.name}>
                      {product.name}
                      {product.isVariant && product.variantCode && (
                        <span className="text-primary font-bold"> #{product.variantCode}</span>
                      )}
                      {product.isVariant && product.variantColor && (
                        <span className="text-muted-foreground"> - {product.variantColor}</span>
                      )}
                      {product.isVariant && product.variantSize && (
                        <span className="text-muted-foreground"> ({product.variantSize})</span>
                      )}
                    </h3>

                    {/* Variant / Category Badges */}
                    <div className="flex flex-wrap gap-1">
                      {product.hasVariants && (
                        <Badge 
                          variant="outline" 
                          className="w-fit text-[10px] sm:text-xs cursor-pointer border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={(e) => { e.stopPropagation(); toggleExpandParent(product.id); }}
                        >
                          <GitBranch className="w-3 h-3 mr-0.5" />
                          បំរែបំរួល
                          {expandedParents.has(product.id) ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                        </Badge>
                      )}
                      {product.isVariant && (
                        <Badge variant="outline" className="w-fit text-[10px] sm:text-xs border-purple-300 text-purple-600">
                          <GitBranch className="w-3 h-3 mr-0.5" />
                          បំរែបំរួល
                        </Badge>
                      )}
                      <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs hidden xs:inline-flex">
                        {product.categoryName}
                      </Badge>
                    </div>

                    {/* Expanded Variants */}
                    {product.hasVariants && expandedParents.has(product.id) && (
                      <div className="space-y-1 pt-1 border-t">
                        {loadingVariants.has(product.id) ? (
                          <p className="text-[10px] text-muted-foreground">កំពុងផ្ទុកបំរែបំរួល...</p>
                        ) : (
                          (product.variants || variantsCache[product.id] || []).map((v) => {
                            const label = [v.variantCode && `#${v.variantCode}`, v.variantColor, v.variantSize].filter(Boolean).join(' · ');
                            return (
                              <div key={v.id} className="flex items-center justify-between text-[10px] sm:text-xs px-1.5 py-1 bg-muted/50 rounded">
                                <span className="font-medium truncate">{label || 'បំរែបំរួល'}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-muted-foreground">×{v.stockQuantity}</span>
                                  <span className="font-semibold">${v.price.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Price Section */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">
                          {formatUSD(product.discountedPrice)}
                        </span>
                        {product.discountPercent > 0 && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                            {formatUSD(product.price)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-foreground/70">
                        {formatKHR(product.discountedPrice)}
                      </span>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span className="hidden sm:inline">តម្លៃដើម: {formatUSD(product.costPrice)}</span>
                        <span className="text-green-600 font-semibold text-[10px] sm:text-xs">
                          +{formatUSD(product.profit)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - Compact on Mobile */}
                    <div className="flex gap-1 sm:gap-2 pt-1 sm:pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs px-1 sm:px-2"
                        disabled={isLoading}
                      >
                        <Pencil className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">កែ</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStockHistory(product)}
                        className="h-7 sm:h-8 px-1.5 sm:px-2"
                        title="ប្រវត្តិស្តុក"
                      >
                        <History className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenMultiImage(product)}
                        className="h-7 sm:h-8 px-1.5 sm:px-2"
                        title="រូបភាព"
                      >
                        <ImageIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="h-7 sm:h-8 px-1.5 sm:px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        disabled={isLoading}
                        title="លុប"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-semibold">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">ផលិតផល</th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">ប្រភេទ</th>
                      <th className="px-4 py-3 text-right font-semibold">តម្លៃដើម</th>
                      <th className="px-4 py-3 text-right font-semibold">តម្លៃ</th>
                      <th className="px-4 py-3 text-right font-semibold hidden lg:table-cell">ចំណេញ</th>
                      <th className="px-4 py-3 text-center font-semibold">ស្តុក</th>
                      <th className="px-4 py-3 text-right font-semibold hidden xl:table-cell">តម្លៃសរុប</th>
                      <th className="px-4 py-3 text-center font-semibold">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const tableEffectiveStock = getEffectiveStock(product);
                      const profitMargin = product.price > 0 ? ((product.profit / product.price) * 100) : 0;
                      const isSelected = selectedProducts.has(product.id);
                      
                      return (
                        <tr 
                          key={product.id} 
                          className={cn(
                            "border-b hover:bg-muted/50 transition-colors",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectProduct(product.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          
                          {/* Product Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[200px]" title={product.name}>
                                  {product.name}
                                </p>
                                {product.barcode && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {product.barcode}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">{product.categoryName}</Badge>
                          </td>

                          {/* Cost */}
                          <td className="px-4 py-3 text-right font-medium">
                            ${product.costPrice.toFixed(2)}
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3 text-right">
                            <div className="text-right">
                              <div className="font-semibold">${product.discountedPrice.toFixed(2)}</div>
                              {product.discountPercent > 0 && (
                                <div className="text-xs text-muted-foreground line-through">
                                  ${product.price.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Profit */}
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <div className="text-right">
                              <div className="font-semibold text-green-600">${product.profit.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}%</div>
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="px-4 py-3 text-center">
                            <Badge className={getStockBadgeClasses(tableEffectiveStock)}>
                              {product.hasVariants ? `Σ${tableEffectiveStock}` : tableEffectiveStock}
                            </Badge>
                            {product.hasVariants && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {product.variants?.length ?? '?'} បំរែបំរួល
                              </div>
                            )}
                          </td>

                          {/* Total Value */}
                          <td className="px-4 py-3 text-right hidden xl:table-cell">
                            <div className="text-right">
                              <div className="font-medium">${(product.costPrice * tableEffectiveStock).toFixed(2)}</div>
                              <div className="text-xs text-green-600">
                                +${(product.profit * tableEffectiveStock).toFixed(2)}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/products/${product.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="មើលផលិតផល">
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="កែសម្រួលផលិតផល"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenStockHistory(product)}
                                className="h-8 w-8 p-0"
                                title="ប្រវត្តិស្តុក"
                              >
                                <History className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenMultiImage(product)}
                                className="h-8 w-8 p-0"
                                title="គ្រប់គ្រងរូបភាព"
                              >
                                <ImageIcon className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0 hover:text-destructive"
                                title="លុបផលិតផល"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">រកមិនឃើញផលិតផល</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {activeFiltersCount > 0
                  ? 'គ្មានផលិតផលត្រូវនឹងតម្រងបច្ចុប្បន្នរបស់អ្នក។ សាកល្បងតម្រងផ្សេង។'
                  : 'ចាប់ផ្តើមដោយបង្កើតផលិតផលដំបូងរបស់អ្នក'}
              </p>
              {activeFiltersCount > 0 ? (
                <Button onClick={clearAllFilters} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  សម្អាតតម្រង
                </Button>
              ) : (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  បង្កើតផលិតផល
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination - Only show in Grid View when there are products */}
        {viewMode === 'grid' && !isFetchingProducts && totalProducts > pageSize && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  បង្ហាញ {currentPage * pageSize + 1} ដល់ {Math.min((currentPage + 1) * pageSize, totalProducts)} នៃ {totalProducts} ផលិតផល
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    មុន
                  </Button>
                  <div className="text-sm font-medium px-3">
                    ទំព័រ {currentPage + 1} នៃ {Math.ceil(totalProducts / pageSize)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={(currentPage + 1) * pageSize >= totalProducts}
                  >
                    បន្ទាប់
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, productId: null })}
          onConfirm={confirmDelete}
          title="លុបផលិតផល"
          description="តើអ្នកប្រាកដថាចង់លុបផលិតផលនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។"
          confirmText="លុប"
          cancelText="បោះបង់"
          variant="destructive"
        />

        {/* Barcode Scanner Dialog */}
        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleBarcodeScanned}
        />

        {/* Stock History Dialog */}
        <StockHistoryDialog
          open={stockHistoryDialog.open}
          onOpenChange={(open) =>
            setStockHistoryDialog({ open, productId: null, productName: '', currentStock: 0 })
          }
          productId={stockHistoryDialog.productId || ''}
          productName={stockHistoryDialog.productName}
          currentStock={stockHistoryDialog.currentStock}
          onStockAdjusted={handleStockAdjusted}
        />

        {/* Multi-Image Upload Dialog */}
        <MultiImageUpload
          open={multiImageDialog.open}
          onOpenChange={(open) =>
            setMultiImageDialog({ open, productId: null, productName: '' })
          }
          productId={multiImageDialog.productId || ''}
          productName={multiImageDialog.productName}
          onImagesUpdated={handleImagesUpdated}
        />
      </div>
    );
  }
