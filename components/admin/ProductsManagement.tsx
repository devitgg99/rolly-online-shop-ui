'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Plus, Pencil, Trash2, Search, Filter, DollarSign, Box, TrendingUp, X, Tag, Layers, ShoppingBag, Sparkles, AlertTriangle, TrendingDown, Eye, Minus, Download, Keyboard, History, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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

import type { AdminProduct, ProductRequest, InventoryStats } from '@/types/product.types';
import type { Brand } from '@/types/brand.types';
import type { Category } from '@/types/category.types';
import { 
  createProductAction, 
  updateProductAction, 
  deleteProductAction,
  fetchInventoryStatsAction,
  fetchLowStockProductsAction,
  fetchAdminProductsAction
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
  });

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
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
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
          toast.info(`Showing ${localLowStock.length} low stock products (local filter)`);
        } else {
          toast.error('Backend endpoint not available. Please update your backend with the new stats endpoints.');
        }
      }
    } catch (error) {
      console.error('❌ Error loading low stock products:', error);
      toast.error('Failed to load low stock products. Backend endpoint may not be available yet.');
    }
    setIsLoading(false);
  };

  // File upload handler
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      if (!session?.backendToken) {
        toast.error('Authentication required');
        throw new Error('No authentication token');
      }

      toast.info('Uploading image... 📤');
      const response = await uploadFileAction(file, session.backendToken);
      
      if (response.success && response.data?.url) {
        toast.success('Image uploaded successfully! ✅');
        return response.data.url;
      } else {
        toast.error(response.message || 'Failed to upload image');
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      throw error;
    }
  };

  // Barcode scan handler
  const handleBarcodeScanned = (barcode: string) => {
    console.log('📱 Barcode scanned:', barcode);
    setFormData({ ...formData, barcode });
    toast.success(`Barcode captured: ${barcode}`);
    setScannerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imageUrl) {
      toast.error('Please upload a product image');
      return;
    }

    const costPrice = parseFloat(formData.costPrice) || 0;
    const price = parseFloat(formData.price) || 0;
    const discountPercent = parseInt(formData.discountPercent) || 0;
    const stockQuantity = parseInt(formData.stockQuantity) || 0;

    if (costPrice >= price) {
      toast.error('Selling price must be greater than cost price!');
      return;
    }

    if (price <= 0) {
      toast.error('Selling price must be greater than 0!');
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
      };

      if (editingProduct) {
        const response = await updateProductAction(editingProduct.id, productRequest);
        
        if (response.success && response.data) {
          // Update local state with the returned data
          setProducts(products.map(p => 
            p.id === editingProduct.id ? {
              id: response.data!.id,
              name: response.data!.name,
              costPrice: response.data!.costPrice,
              price: response.data!.price,
              discountPercent: response.data!.discountPercent,
              discountedPrice: response.data!.discountedPrice,
              profit: response.data!.profit,
              stockQuantity: response.data!.stockQuantity,
              imageUrl: response.data!.imageUrl,
              brandName: response.data!.brand?.name,
              categoryName: response.data!.category.name,
            } : p
          ));
          toast.success('Product updated successfully! 🎉');
        } else {
          toast.error(response.message || 'Failed to update product');
        }
      } else {
        const response = await createProductAction(productRequest);
        
        if (response.success && response.data) {
          // Add new product to local state
          const newProduct: AdminProduct = {
            id: response.data.id,
            name: response.data.name,
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
          setProducts([newProduct, ...products]);
          toast.success('Product created successfully! 🎉');
        } else {
          toast.error(response.message || 'Failed to create product');
        }
      }
      
      resetForm();
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    // Only reset form when switching from edit → add mode
    // Keep draft data if user was already adding a product
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
      });
    }
    setDialogOpen(true);
  };

  const handleEdit = (product: AdminProduct) => {
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
    });
    setDialogOpen(true);
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
          toast.success('Product deleted successfully! 🗑️');
        } else {
          toast.error(response.message || 'Failed to delete product');
        }
      } catch (error) {
        toast.error('An unexpected error occurred. Please try again.');
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
      toast.error('Authentication required');
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
        toast.success(`Products exported successfully as ${format.toUpperCase()}!`);
      } else {
        toast.error(response.message || 'Failed to export products');
      }
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
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

  const totalValue = products.reduce((sum, p) => sum + (p.discountedPrice * p.stockQuantity), 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.profit * p.stockQuantity), 0);
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
    
    if (!confirm(`Delete ${selectedProducts.size} products? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const promises = Array.from(selectedProducts).map(id => deleteProductAction(id));
      await Promise.all(promises);
      
      setProducts(products.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
      toast.success(`${selectedProducts.size} products deleted successfully!`);
    } catch (error) {
      toast.error('Failed to delete some products');
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
          Add Product
        </Button>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update the product information below' : 'Fill in the details to add a new product to your inventory'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode (Optional) 📱</Label>
                    <div className="flex gap-2">
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="Scan or enter barcode"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setScannerOpen(true)}
                        title="Scan barcode"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">For quick product lookup at POS</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price ($) * 💰</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      placeholder="What you paid"
                      required
                    />
                    <p className="text-xs text-muted-foreground">What you paid for this product</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price ($) * 💵</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="What customer pays"
                      required
                    />
                    <p className="text-xs text-muted-foreground">What customers will pay</p>
                  </div>

                  {(parseFloat(formData.costPrice) > 0 && parseFloat(formData.price) > 0) && (
                    <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estimated Profit (before discount):</span>
                        <span className={`text-lg font-bold ${parseFloat(formData.price) > parseFloat(formData.costPrice) ? 'text-green-600' : 'text-red-600'}`}>
                          ${(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                        </span>
                      </div>
                      {parseFloat(formData.discountPercent) > 0 && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium">Profit after {formData.discountPercent}% discount:</span>
                          <span className={`text-lg font-bold ${(parseFloat(formData.price) * (1 - parseFloat(formData.discountPercent) / 100)) > parseFloat(formData.costPrice) ? 'text-green-600' : 'text-red-600'}`}>
                            ${((parseFloat(formData.price) * (1 - parseFloat(formData.discountPercent) / 100)) - parseFloat(formData.costPrice)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      placeholder="Enter quantity"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })} 
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Product Image *</Label>
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
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                  </Button>
                </DialogFooter>
              </form>
        </DialogContent>
      </Dialog>

      {/* Inventory Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventoryStats?.totalProducts ?? products.length}
              </div>
              <p className="text-xs text-muted-foreground">All products</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(inventoryStats?.totalValue ?? totalValue).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
              <p className="text-xs text-muted-foreground">Cost × Stock</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit 💰</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(inventoryStats?.totalPotentialProfit ?? totalProfit).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
              <p className="text-xs text-muted-foreground">Potential earnings</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-amber-200 dark:border-amber-800"
            onClick={loadLowStockProducts}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock ⚠️</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {inventoryStats?.lowStockCount ?? products.filter(p => p.stockQuantity < lowStockThreshold).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Need restock (≤{lowStockThreshold}) - Click to view
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
                      Low Stock Alert 📦
                    </CardTitle>
                    <CardDescription className="text-amber-700 dark:text-amber-300">
                      {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} need restocking
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
                                <>Out of Stock</>
                              ) : (
                                <>{product.stockQuantity} left</>
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
                <CardTitle className="text-lg">Filters</CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({filteredProducts.length} of {products.length})
                </span>
                {selectedProducts.size > 0 && (
                  <Badge variant="secondary">
                    {selectedProducts.size} selected
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
                    Delete Selected ({selectedProducts.size})
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
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={isExporting || products.length === 0}
                  className="h-8"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export Excel
                </Button>
                
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 text-xs"
                  >
                    Clear all
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
                placeholder="Search products... (Ctrl+K)"
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
                <Label className="text-xs text-muted-foreground">Category</Label>
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
                    All Categories
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
              const stockInfo = getStockLevelInfo(product.stockQuantity);
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
                        getStockBadgeClasses(product.stockQuantity)
                      )}
                    >
                      {product.stockQuantity}
                    </Badge>

                    {/* Quick Actions on Hover - Hidden on Mobile */}
                    <div className="hidden sm:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                      <Link href={`/products/${product.id}`}>
                        <Button size="sm" variant="secondary">
                          <Eye className="w-3 h-3 mr-1" />
                          View
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
                    </h3>

                    {/* Category - Hidden on smallest mobile */}
                    <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs hidden xs:inline-flex">
                      {product.categoryName}
                    </Badge>

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
                        <span className="hidden sm:inline">Cost: {formatUSD(product.costPrice)}</span>
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
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStockHistory(product)}
                        className="h-7 sm:h-8 px-1.5 sm:px-2"
                        title="Stock History"
                      >
                        <History className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenMultiImage(product)}
                        className="h-7 sm:h-8 px-1.5 sm:px-2"
                        title="Images"
                      >
                        <ImageIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="h-7 sm:h-8 px-1.5 sm:px-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        disabled={isLoading}
                        title="Delete"
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
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Category</th>
                      <th className="px-4 py-3 text-right font-semibold">Cost</th>
                      <th className="px-4 py-3 text-right font-semibold">Price</th>
                      <th className="px-4 py-3 text-right font-semibold hidden lg:table-cell">Profit</th>
                      <th className="px-4 py-3 text-center font-semibold">Stock</th>
                      <th className="px-4 py-3 text-right font-semibold hidden xl:table-cell">Total Value</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
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
                            <Badge className={getStockBadgeClasses(product.stockQuantity)}>
                              {product.stockQuantity}
                            </Badge>
                          </td>

                          {/* Total Value */}
                          <td className="px-4 py-3 text-right hidden xl:table-cell">
                            <div className="text-right">
                              <div className="font-medium">${(product.costPrice * product.stockQuantity).toFixed(2)}</div>
                              <div className="text-xs text-green-600">
                                +${(product.profit * product.stockQuantity).toFixed(2)}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/products/${product.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Product">
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0"
                                title="Edit Product"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenStockHistory(product)}
                                className="h-8 w-8 p-0"
                                title="Stock History"
                              >
                                <History className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenMultiImage(product)}
                                className="h-8 w-8 p-0"
                                title="Manage Images"
                              >
                                <ImageIcon className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0 hover:text-destructive"
                                title="Delete Product"
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
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {activeFiltersCount > 0
                  ? 'No products match your current filters. Try adjusting or clearing them.'
                  : 'Get started by creating your first product'}
              </p>
              {activeFiltersCount > 0 ? (
                <Button onClick={clearAllFilters} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
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
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalProducts)} of {totalProducts} products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-3">
                    Page {currentPage + 1} of {Math.ceil(totalProducts / pageSize)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={(currentPage + 1) * pageSize >= totalProducts}
                  >
                    Next
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
          title="Delete Product"
          description="Are you sure you want to delete this product? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
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
