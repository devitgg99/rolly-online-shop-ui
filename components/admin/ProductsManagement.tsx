'use client';

import { useState } from 'react';
import { Package, Plus, Pencil, Trash2, Search, Filter, DollarSign, Box, TrendingUp } from 'lucide-react';
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

import type { Product, ProductRequest } from '@/types/product.types';

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  stockQuantity: number;
  imageUrl: string;
  brandId: string;
  categoryId: string;
};

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Nike Air Max 270',
      price: 150,
      discountPercent: 10,
      discountedPrice: 135,
      stockQuantity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      brandName: 'Nike',
      categoryName: 'Running Shoes',
    },
    {
      id: '2',
      name: 'Adidas Ultraboost',
      price: 180,
      discountPercent: 15,
      discountedPrice: 153,
      stockQuantity: 30,
      imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400',
      brandName: 'Adidas',
      categoryName: 'Running Shoes',
    },
  ]);

  const brands = [
    { id: '1', name: 'Nike' },
    { id: '2', name: 'Adidas' },
    { id: '3', name: 'Puma' },
  ];

  const categories = [
    { id: '1', name: 'Footwear' },
    { id: '2', name: 'Running Shoes' },
    { id: '3', name: 'Apparel' },
    { id: '4', name: 'T-Shirts' },
  ];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    discountPercent: 0,
    stockQuantity: 0,
    imageUrl: '',
    brandId: '',
    categoryId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        const updatedProduct: Product = {
          ...editingProduct,
          name: formData.name,
          price: formData.price,
          discountPercent: formData.discountPercent,
          discountedPrice: formData.price - (formData.price * formData.discountPercent / 100),
          stockQuantity: formData.stockQuantity,
          imageUrl: formData.imageUrl,
          brandName: getBrandName(formData.brandId),
          categoryName: getCategoryName(formData.categoryId),
        };
        
        setProducts(products.map(p => 
          p.id === editingProduct.id ? updatedProduct : p
        ));
        toast.success('Product updated successfully!');
      } else {
        const newProduct: Product = {
          id: Date.now().toString(),
          name: formData.name,
          price: formData.price,
          discountPercent: formData.discountPercent,
          discountedPrice: formData.price - (formData.price * formData.discountPercent / 100),
          stockQuantity: formData.stockQuantity,
          imageUrl: formData.imageUrl,
          brandName: getBrandName(formData.brandId),
          categoryName: getCategoryName(formData.categoryId),
        };
        setProducts([...products, newProduct]);
        toast.success('Product created successfully!');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const brandId = brands.find(b => b.name === product.brandName)?.id || '';
    const categoryId = categories.find(c => c.name === product.categoryName)?.id || '';
    
    setFormData({
      name: product.name,
      description: '',
      price: product.price,
      discountPercent: product.discountPercent,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
      brandId,
      categoryId,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, productId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.productId) {
      try {
        setProducts(products.filter(p => p.id !== deleteDialog.productId));
        toast.success('Product deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete product. Please try again.');
      }
    }
    setDeleteDialog({ open: false, productId: null });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      discountPercent: 0,
      stockQuantity: 0,
      imageUrl: '',
      brandId: '',
      categoryId: '',
    });
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const getBrandName = (brandId: string) => brands.find(b => b.id === brandId)?.name || 'Unknown';
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || 'Unknown';

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || product.brandName.toLowerCase() === getBrandName(filterBrand).toLowerCase();
    const matchesCategory = filterCategory === 'all' || product.categoryName.toLowerCase() === getCategoryName(filterCategory).toLowerCase();
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const totalValue = products.reduce((sum, p) => sum + (p.discountedPrice * p.stockQuantity), 0);
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
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Product Image *</Label>
                    <ImageUpload
                      value={formData.imageUrl}
                      onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                      showUrlInput={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })} required>
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
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })} required>
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
                  <Label htmlFor="description-full">Full Description</Label>
                  <Textarea
                    id="description-full"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter detailed product description..."
                    rows={4}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">All products</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Inventory worth</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {products.filter(p => p.stockQuantity < 20).length}
              </div>
              <p className="text-xs text-muted-foreground">Need restock</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgPrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per product</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden bg-accent">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 right-3 flex justify-between">
                    {product.discountPercent > 0 && (
                      <Badge variant="destructive" className="shadow-lg">
                        -{product.discountPercent}%
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-xs">ID: {product.id.substring(0, 8)}...</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline">{product.brandName}</Badge>
                    <Badge variant="outline">{product.categoryName}</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      {product.discountPercent > 0 ? (
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-primary">
                            ${product.discountedPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground line-through">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <Badge variant={product.stockQuantity < 20 ? 'destructive' : 'secondary'}>
                      {product.stockQuantity} in stock
                    </Badge>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Pencil className="w-3 h-3 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {products.length === 0 
                    ? 'Get started by creating your first product'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
              {products.length === 0 && (
                <Button onClick={() => setDialogOpen(true)} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Product
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
    </div>
  );
}
