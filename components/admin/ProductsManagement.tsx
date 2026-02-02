'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, Search, Filter, DollarSign, Box, TrendingUp, X, Tag, Layers, ShoppingBag, Sparkles, AlertTriangle, TrendingDown } from 'lucide-react';
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

import type { AdminProduct, ProductRequest, InventoryStats } from '@/types/product.types';
import type { Brand } from '@/types/brand.types';
import type { Category } from '@/types/category.types';
import { 
  createProductAction, 
  updateProductAction, 
  deleteProductAction,
  fetchInventoryStatsAction,
  fetchLowStockProductsAction 
} from '@/actions/products/products.action';
import { uploadFileAction } from '@/actions/fileupload/fileupload.action';
import BarcodeScanner from './BarcodeScanner';

type ProductFormData = {
  name: string;
  description: string;
  barcode: string; // Added barcode
  costPrice: string;
  price: string;
  discountPercent: string;
  stockQuantity: string;
  imageUrl: string;
  brandId: string;
  categoryId: string;
};

interface ProductsManagementProps {
  initialProducts: AdminProduct[];
  brands: Brand[];
  categories: Category[];
}

export default function ProductsManagement({ initialProducts, brands, categories }: ProductsManagementProps) {
  console.log('🎨 ProductsManagement rendered with:', {
    productsCount: initialProducts.length,
    brandsCount: brands.length,
    categoriesCount: categories.length,
    products: initialProducts
  });

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false); // Added barcode scanner state
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<AdminProduct[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    barcode: '', // Added barcode
    costPrice: '',
    price: '',
    discountPercent: '',
    stockQuantity: '',
    imageUrl: '',
    brandId: '',
    categoryId: '',
  });

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
      toast.info('Uploading image... 📤');
      const response = await uploadFileAction(file);
      
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
        barcode: formData.barcode || undefined, // Added barcode (optional)
        costPrice,
        price,
        discountPercent,
        stockQuantity,
        imageUrl: formData.imageUrl,
        brandId: formData.brandId,
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
              brandName: response.data!.brand.name,
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
            brandName: response.data.brand.name,
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
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      barcode: '', // Ensure empty string, not undefined
      costPrice: '',
      price: '',
      discountPercent: '',
      stockQuantity: '',
      imageUrl: '',
      brandId: '',
      categoryId: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    const brandId = brands.find(b => b.name === product.brandName)?.id || '';
    const categoryId = categories.find(c => c.name === product.categoryName)?.id || '';
    
    setFormData({
      name: product.name,
      description: '',
      barcode: product.barcode || '', // Added barcode
      costPrice: product.costPrice.toString(),
      price: product.price.toString(),
      discountPercent: product.discountPercent.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl,
      brandId,
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
      barcode: '', // Added barcode
      costPrice: '',
      price: '',
      discountPercent: '',
      stockQuantity: '',
      imageUrl: '',
      brandId: '',
      categoryId: '',
    });
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || 
      brands.find(b => b.id === filterBrand)?.name === product.brandName;
    const matchesCategory = filterCategory === 'all' || 
      categories.find(c => c.id === filterCategory)?.name === product.categoryName;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const activeFiltersCount = (searchTerm ? 1 : 0) + (filterBrand !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0);
  
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterBrand('all');
    setFilterCategory('all');
  };

  const getActiveBrandName = () => brands.find(b => b.id === filterBrand)?.name || '';
  const getActiveCategoryName = () => categories.find(c => c.id === filterCategory)?.name || '';

  const totalValue = products.reduce((sum, p) => sum + (p.discountedPrice * p.stockQuantity), 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.profit * p.stockQuantity), 0);
  const avgPrice = products.length > 0 ? (products.reduce((sum, p) => sum + p.discountedPrice, 0) / products.length) : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/50">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Products</h1>
                <p className="text-muted-foreground">Manage your product inventory</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg" onClick={() => { setEditingProduct(null); resetForm(); }}>
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
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
                    <Label htmlFor="brand">Brand *</Label>
                    <Select 
                      value={formData.brandId} 
                      onValueChange={(value) => setFormData({ ...formData, brandId: value })} 
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        </div>

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

        {/* Search & Filters - Clean & Simple */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Filters</CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({filteredProducts.length} of {products.length})
                </span>
              </div>
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
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Brand */}
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-accent rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterBrand !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {getActiveBrandName()}
                    <button
                      onClick={() => setFilterBrand('all')}
                      className="ml-1 hover:bg-accent rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
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

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-muted">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {product.discountPercent > 0 && (
                    <Badge variant="destructive" className="absolute top-2 left-2">
                      -{product.discountPercent}%
                    </Badge>
                  )}
                  <Badge 
                    variant={product.stockQuantity < 20 ? 'destructive' : 'secondary'}
                    className="absolute top-2 right-2"
                  >
                    Stock: {product.stockQuantity}
                  </Badge>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  {/* Product Name */}
                  <h3 className="font-semibold line-clamp-2">{product.name}</h3>

                  {/* Brand & Category */}
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">{product.brandName}</Badge>
                    <Badge variant="outline">{product.categoryName}</Badge>
                  </div>

                  {/* Prices */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium">${product.costPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${product.price.toFixed(2)}</span>
                    </div>
                    {product.discountPercent > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Discounted:</span>
                        <span className="font-semibold">${product.discountedPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Profit/unit:</span>
                      <span className="font-semibold text-green-600">${product.profit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total profit:</span>
                      <span className="font-bold text-green-600">${(product.profit * product.stockQuantity).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {products.length === 0 
                  ? 'Get started by creating your first product'
                  : 'Try adjusting your filters'
                }
              </p>
              {products.length === 0 && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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
    </div>
  );
}
