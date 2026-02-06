'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Eye, Pencil, Trash2, ArrowRight, Loader2, Layers, ChevronDown, ChevronUp, History, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import type { AdminProduct } from '@/types/product.types';
import type { Category } from '@/types/category.types';
import { fetchAdminProductsAction, deleteProductAction } from '@/actions/products/products.action';
import { getStockBadgeClasses } from '@/lib/stock-utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StockHistoryDialog } from './StockHistoryDialog';
import { MultiImageUpload } from './MultiImageUpload';

interface CategoryWithProducts {
  category: Category;
  products: AdminProduct[];
  totalCount: number;
  isLoading: boolean;
  isExpanded: boolean;
}

interface ProductsByCategoryProps {
  categories: Category[];
}

export default function ProductsByCategory({ categories }: ProductsByCategoryProps) {
  const { data: session } = useSession();
  const [categoryGroups, setCategoryGroups] = useState<CategoryWithProducts[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });
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
  
  const [isDeleting, setIsDeleting] = useState(false);

  // Load products for all categories
  useEffect(() => {
    loadAllCategories();
  }, [categories]);

  const loadAllCategories = async () => {
    if (!session?.backendToken) return;
    
    setIsInitialLoading(true);
    
    // Initialize category groups
    const groups: CategoryWithProducts[] = categories.map(cat => ({
      category: cat,
      products: [],
      totalCount: 0,
      isLoading: true,
      isExpanded: false,
    }));
    setCategoryGroups(groups);

    // Load products for each category (8 per category for preview)
    const updatedGroups = await Promise.all(
      categories.map(async (category) => {
        try {
          const response = await fetchAdminProductsAction(
            0, // page
            8, // size - show 8 products per category
            'createdAt',
            'desc',
            category.id // filter by this category
          );

          if (response.success && response.data) {
            return {
              category,
              products: response.data.content,
              totalCount: response.data.totalElements,
              isLoading: false,
              isExpanded: false,
            };
          } else {
            return {
              category,
              products: [],
              totalCount: 0,
              isLoading: false,
              isExpanded: false,
            };
          }
        } catch (error) {
          console.error(`Error loading products for category ${category.name}:`, error);
          return {
            category,
            products: [],
            totalCount: 0,
            isLoading: false,
            isExpanded: false,
          };
        }
      })
    );

    // Filter out categories with no products
    setCategoryGroups(updatedGroups.filter(g => g.totalCount > 0));
    setIsInitialLoading(false);
  };

  const handleShowAll = async (categoryId: string) => {
    const groupIndex = categoryGroups.findIndex(g => g.category.id === categoryId);
    if (groupIndex === -1) return;

    const group = categoryGroups[groupIndex];

    // Toggle expansion
    if (group.isExpanded) {
      // Collapse - just show first 8 again
      const updated = [...categoryGroups];
      updated[groupIndex] = {
        ...group,
        isExpanded: false,
      };
      setCategoryGroups(updated);
      return;
    }

    // Expand - load all products for this category
    const updated = [...categoryGroups];
    updated[groupIndex] = { ...group, isLoading: true };
    setCategoryGroups(updated);

    try {
      const response = await fetchAdminProductsAction(
        0,
        100, // Load up to 100 products when expanded
        'createdAt',
        'desc',
        categoryId
      );

      if (response.success && response.data) {
        updated[groupIndex] = {
          ...group,
          products: response.data.content,
          isLoading: false,
          isExpanded: true,
        };
      } else {
        toast.error('Failed to load products');
        updated[groupIndex] = { ...group, isLoading: false };
      }
    } catch (error) {
      console.error('Error loading category products:', error);
      toast.error('Failed to load products');
      updated[groupIndex] = { ...group, isLoading: false };
    }

    setCategoryGroups(updated);
  };

  const handleDelete = (productId: string) => {
    setDeleteDialog({ open: true, productId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.productId) return;

    setIsDeleting(true);
    try {
      const response = await deleteProductAction(deleteDialog.productId);
      
      if (response.success) {
        // Remove product from all category groups
        setCategoryGroups(categoryGroups.map(group => ({
          ...group,
          products: group.products.filter(p => p.id !== deleteDialog.productId),
          totalCount: group.totalCount - (group.products.some(p => p.id === deleteDialog.productId) ? 1 : 0),
        })).filter(g => g.totalCount > 0)); // Remove empty categories
        
        toast.success('Product deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, productId: null });
    }
  };

  const handleOpenStockHistory = (product: AdminProduct) => {
    setStockHistoryDialog({
      open: true,
      productId: product.id,
      productName: product.name,
      currentStock: product.stockQuantity,
    });
  };

  const handleOpenMultiImage = (product: AdminProduct) => {
    setMultiImageDialog({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  const handleImagesUpdated = () => {
    // Reload products for the affected category
    loadAllCategories();
  };

  if (isInitialLoading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading products...</h3>
          <p className="text-muted-foreground text-sm">
            Organizing products by category
          </p>
        </CardContent>
      </Card>
    );
  }

  if (categoryGroups.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground text-sm">
            Start by creating products in your categories
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {categoryGroups.map((group) => (
          <Card key={group.category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Layers className="w-6 h-6 text-primary" />
                    {group.category.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {group.category.description || 'No description'}
                    {' • '}
                    <span className="font-medium text-foreground">{group.totalCount} products</span>
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleShowAll(group.category.id)}
                  variant={group.isExpanded ? "secondary" : "outline"}
                  disabled={group.isLoading}
                  size="sm"
                >
                  {group.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : group.isExpanded ? (
                    <>
                      Show Less
                      <ChevronUp className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Show All ({group.totalCount})
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {group.isExpanded ? (
                /* Expanded: Show all products in grid */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDelete={handleDelete}
                      onOpenStockHistory={handleOpenStockHistory}
                      onOpenMultiImage={handleOpenMultiImage}
                    />
                  ))}
                </div>
              ) : (
                /* Collapsed: Horizontal scroll */
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
                    {group.products.map((product) => (
                      <div key={product.id} className="flex-none w-64 snap-start">
                        <ProductCard
                          product={product}
                          onDelete={handleDelete}
                          onOpenStockHistory={handleOpenStockHistory}
                          onOpenMultiImage={handleOpenMultiImage}
                        />
                      </div>
                    ))}
                    
                    {/* Show More Card */}
                    {group.totalCount > 8 && (
                      <div className="flex-none w-64 snap-start">
                        <Card 
                          className="h-full min-h-[400px] flex items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all"
                          onClick={() => handleShowAll(group.category.id)}
                        >
                          <CardContent className="text-center p-6">
                            <ArrowRight className="w-12 h-12 mx-auto mb-3 text-primary" />
                            <p className="font-semibold text-lg">View All</p>
                            <p className="text-sm text-muted-foreground">
                              +{group.totalCount - 8} more
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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

      {/* Stock History Dialog */}
      <StockHistoryDialog
        open={stockHistoryDialog.open}
        onOpenChange={(open) => !open && setStockHistoryDialog({ open: false, productId: null, productName: '', currentStock: 0 })}
        productId={stockHistoryDialog.productId}
        productName={stockHistoryDialog.productName}
        currentStock={stockHistoryDialog.currentStock}
      />

      {/* Multi Image Upload Dialog */}
      <MultiImageUpload
        open={multiImageDialog.open}
        onOpenChange={(open) => !open && setMultiImageDialog({ open: false, productId: null, productName: '' })}
        productId={multiImageDialog.productId}
        productName={multiImageDialog.productName}
        onImagesUpdated={handleImagesUpdated}
      />
    </>
  );
}

// Product Card Component (Reusable)
function ProductCard({ 
  product, 
  onDelete, 
  onOpenStockHistory, 
  onOpenMultiImage 
}: {
  product: AdminProduct;
  onDelete: (productId: string) => void;
  onOpenStockHistory: (product: AdminProduct) => void;
  onOpenMultiImage: (product: AdminProduct) => void;
}) {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-primary/50 h-full">
      {/* Product Image */}
      <div className="relative h-48 bg-muted/30 overflow-hidden">
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
            <Package className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 shadow-md">
            -{product.discountPercent}% OFF
          </Badge>
        )}
        
        {/* Stock Badge */}
        <Badge 
          className={cn(
            "absolute top-2 right-2 shadow-md",
            getStockBadgeClasses(product.stockQuantity)
          )}
        >
          {product.stockQuantity} in stock
        </Badge>

        {/* Quick View on Hover */}
        <Link href={`/products/${product.id}`}>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </Link>
      </div>

      {/* Product Info */}
      <CardContent className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]" title={product.name}>
          {product.name}
        </h3>

        {/* Category */}
        <Badge variant="secondary" className="w-fit">
          {product.categoryName}
        </Badge>

        {/* Price Section */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${product.discountedPrice.toFixed(2)}
            </span>
            {product.discountPercent > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cost: ${product.costPrice.toFixed(2)}</span>
            <span className="text-green-600 font-semibold">
              +${product.profit.toFixed(2)} profit
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenStockHistory(product)}
            title="Stock History"
          >
            <History className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenMultiImage(product)}
            title="Manage Images"
          >
            <ImageIcon className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
