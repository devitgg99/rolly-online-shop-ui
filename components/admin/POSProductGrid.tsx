'use client';

import { useState } from 'react';
import { Search, Filter, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminProduct } from '@/types/product.types';
import Image from 'next/image';

interface POSProductGridProps {
  products: AdminProduct[];
  onSelectProduct: (product: AdminProduct) => void;
  selectedProductId?: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function POSProductGrid({
  products,
  onSelectProduct,
  selectedProductId,
  searchTerm,
  onSearchChange,
}: POSProductGridProps) {
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique brands and categories
  const brands = Array.from(new Set(products.map(p => p.brandName)));
  const categories = Array.from(new Set(products.map(p => p.categoryName)));

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || product.brandName === filterBrand;
    const matchesCategory = filterCategory === 'all' || product.categoryName === filterCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-xl border border-border">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <Input
            type="text"
            placeholder="Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {/* Brand Filter */}
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background hover:bg-secondary/50 transition-colors"
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background hover:bg-secondary/50 transition-colors"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(filterBrand !== 'all' || filterCategory !== 'all' || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterBrand('all');
                setFilterCategory('all');
                onSearchChange('');
              }}
              className="h-8"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results Count */}
        <p className="text-xs text-foreground/60">
          {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`group relative rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  selectedProductId === product.id
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                } ${product.stockQuantity <= 0 ? 'opacity-50' : ''}`}
              >
                {/* Image Container */}
                <div className="relative w-full aspect-square bg-background/50 overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = '/placeholder-product.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background">
                      <ImageIcon className="w-8 h-8 text-foreground/20" />
                    </div>
                  )}

                  {/* Badge Overlay */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.discountPercent > 0 && (
                      <Badge className="bg-red-500/90 text-white text-xs">
                        -{product.discountPercent}%
                      </Badge>
                    )}
                    {product.stockQuantity <= 0 && (
                      <Badge className="bg-destructive/90 text-white text-xs">
                        Out
                      </Badge>
                    )}
                    {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                      <Badge className="bg-yellow-500/90 text-white text-xs">
                        Low
                      </Badge>
                    )}
                  </div>

                  {/* Out of Stock Overlay */}
                  {product.stockQuantity <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <p className="text-white font-semibold text-xs text-center">Out of Stock</p>
                    </div>
                  )}

                  {/* Hover Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                    <p className="text-white font-bold text-xs">{product.discountedPrice}</p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-2 space-y-1">
                  <p className="text-xs font-semibold line-clamp-2 h-7">{product.name}</p>
                  
                  {/* Price Section */}
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-primary">${product.discountedPrice.toFixed(2)}</p>
                    {product.discountPercent > 0 && (
                      <p className="text-xs text-foreground/50 line-through">${product.price.toFixed(2)}</p>
                    )}
                  </div>

                  {/* Brand & Category */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs py-0 h-5">
                      {product.brandName}
                    </Badge>
                  </div>

                  {/* Stock Info */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-foreground/60">
                      {product.stockQuantity} in stock
                    </span>
                    {product.profit > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                        +${product.profit.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/60 text-sm">No products found</p>
              <p className="text-foreground/40 text-xs mt-1">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
