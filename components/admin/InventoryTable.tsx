'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Download,
  Filter,
  Eye,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

import type { InventoryTableItem } from '@/types/product.types';
import type { Category } from '@/types/category.types';
import { fetchInventoryTableAction } from '@/actions/products/products.action';
import { Label } from '@/components/ui/label';

interface InventoryTableProps {
  initialData: InventoryTableItem[];
  initialPage: number;
  initialSize: number;
  initialTotalElements: number;
  initialTotalPages: number;
  categories: Category[];
}

export default function InventoryTable({ 
  initialData, 
  initialPage, 
  initialSize, 
  initialTotalElements,
  initialTotalPages,
  categories
}: InventoryTableProps) {
  const [data, setData] = useState<InventoryTableItem[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [totalElements, setTotalElements] = useState(initialTotalElements);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data with filters
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchInventoryTableAction(
        page, 
        size, 
        sortBy, 
        direction,
        filterCategory !== 'all' ? filterCategory : undefined,
        debouncedSearch || undefined
      );
      if (response.success && response.data) {
        setData(response.data.content);
        setTotalElements(response.data.totalElements);
        setTotalPages(response.data.totalPages);
      } else {
        toast.error('មិនអាចផ្ទុកទិន្នន័យស្តុក');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('កំហុសក្នុងការផ្ទុកទិន្នន័យ');
    } finally {
      setIsLoading(false);
    }
  };

  // Reload when filters or sorting changes
  useEffect(() => {
    loadData();
  }, [page, size, sortBy, direction, filterCategory, debouncedSearch]);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setDirection('asc');
    }
    setPage(0); // Reset to first page
  };

  // Data is already filtered by backend
  const filteredData = data;

  // Calculate summary
  const summary = {
    totalValue: data.reduce((sum, item) => sum + item.stockValue, 0),
    totalRevenue: data.reduce((sum, item) => sum + item.totalRevenue, 0),
    totalProfit: data.reduce((sum, item) => sum + item.totalProfit, 0),
    totalStock: data.reduce((sum, item) => sum + item.stockQuantity, 0),
  };

  const activeFiltersCount = (debouncedSearch ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0);
  
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setPage(0);
  };

  // Sort indicator
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 opacity-30" />;
    return direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
      : <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">តារាងស្តុក 📊</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            ស្តុកពេញលេញជាមួយការវិភាគការលក់
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            នាំចេញ
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            តម្រង
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              តម្លៃស្តុក
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              ${summary.totalValue.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {summary.totalStock} ឯកតា
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              ចំណូលសរុប
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              ${summary.totalRevenue.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              គ្រប់ពេល
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              ចំណេញសរុប
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              ${summary.totalProfit.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              ប្រាក់ចំណូលសុទ្ធ
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              ផលិតផល
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">
              {totalElements}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              ក្នុងស្តុក
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">ព័ត៌មានស្តុក</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {totalElements} ផលិតផលជាមួយទិន្នន័យការលក់ពេញលេញ
                </CardDescription>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Category Filter */}
              <div className="flex-1 sm:max-w-xs">
                <Select 
                  value={filterCategory} 
                  onValueChange={(value) => {
                    setFilterCategory(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="ប្រភេទទាំងអស់" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ប្រភេទទាំងអស់</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="ស្វែងរកផលិតផល..."
                  className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-9 sm:h-10"
                >
                  សម្អាតតម្រង
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 sm:px-6 pb-3 sm:pb-6">
          {/* Mobile: Card View */}
          <div className="block sm:hidden space-y-2 px-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">កំពុងផ្ទុក...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">រកមិនឃើញផលិតផល</p>
              </div>
            ) : (
              filteredData.map((item) => (
                <Card key={item.id} className="overflow-hidden active:scale-[0.98] transition-all">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {item.categoryName}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">ស្តុក:</span>
                            <span className="font-medium ml-1">{item.stockQuantity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">បានលក់:</span>
                            <span className="font-medium ml-1">{item.totalSold}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">តម្លៃ:</span>
                            <span className="font-medium ml-1 text-green-600">${item.sellingPrice}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ចំណេញ:</span>
                            <span className="font-medium ml-1 text-purple-600">${item.profit}</span>
                          </div>
                        </div>

                        <Link href={`/products/${item.id}`}>
                          <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            មើលព័ត៌មាន
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 px-2">
                      ផលិតផល
                      <SortIcon field="name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('categoryName')} className="h-8 px-2">
                      ប្រភេទ
                      <SortIcon field="categoryName" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('costPrice')} className="h-8 px-2">
                      តម្លៃដើម
                      <SortIcon field="costPrice" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('sellingPrice')} className="h-8 px-2">
                      តម្លៃ
                      <SortIcon field="sellingPrice" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('profit')} className="h-8 px-2">
                      ចំណេញ
                      <SortIcon field="profit" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('stockQuantity')} className="h-8 px-2">
                      ស្តុក
                      <SortIcon field="stockQuantity" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('totalSold')} className="h-8 px-2">
                      បានលក់
                      <SortIcon field="totalSold" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('totalRevenue')} className="h-8 px-2">
                      ចំណូល
                      <SortIcon field="totalRevenue" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-20">សកម្មភាព</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Package className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">កំពុងផ្ទុក...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">រកមិនឃើញផលិតផល</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-muted-foreground">
                        {page * size + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            {item.barcode && (
                              <p className="text-xs text-muted-foreground">{item.barcode}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium">
                        ${item.costPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${item.sellingPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-purple-600 font-medium">
                        ${item.profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.stockQuantity < 10 ? 'destructive' : 'secondary'}>
                          {item.stockQuantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.totalSold}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${item.totalRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/products/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-3 sm:px-0">
            <div className="text-xs sm:text-sm text-muted-foreground">
              បង្ហាញ {page * size + 1} ដល់ {Math.min((page + 1) * size, totalElements)} នៃ {totalElements} ផលិតផល
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
                className="h-8 text-xs sm:text-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                មុន
              </Button>

              <div className="text-xs sm:text-sm text-muted-foreground">
                ទំព័រ {page + 1} នៃ {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="h-8 text-xs sm:text-sm"
              >
                បន្ទាប់
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
