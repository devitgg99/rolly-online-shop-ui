'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Download, Printer, RotateCcw, Filter, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SaleListItem } from '@/types/sales.types';
import { fetchSaleDetailAction } from '@/actions/sales/sales.action';
import { Sale } from '@/types/sales.types';
import { toast } from 'sonner';

interface ReceiptListProps {
  sales: SaleListItem[];
  onRefresh: () => Promise<void>;
  onSelectSale?: (sale: Sale) => void;
  onDownloadPDF?: (saleId: string) => Promise<void>;
  onPrint?: (saleId: string) => Promise<void>;
}

export function ReceiptList({
  sales: initialSales,
  onRefresh,
  onSelectSale,
  onDownloadPDF,
  onPrint,
}: ReceiptListProps) {
  const [sales, setSales] = useState<SaleListItem[]>(initialSales);
  const [filteredSales, setFilteredSales] = useState<SaleListItem[]>(initialSales);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'today' | 'yesterday' | 'week' | 'custom'>('today');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique payment methods
  const paymentMethods = Array.from(new Set(sales.map(s => s.paymentMethod)));

  // Filter sales
  useEffect(() => {
    let filtered = sales;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Payment method filter
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === filterPaymentMethod);
    }

    // Date filter
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filterDateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customDateStart) startDate = new Date(customDateStart);
        if (customDateEnd) endDate = new Date(customDateEnd);
        break;
    }

    filtered = filtered.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });

    setFilteredSales(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [sales, searchTerm, filterPaymentMethod, filterDateRange, customDateStart, customDateEnd]);

  // Update sales list when initial sales change
  useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);

  const handleViewSale = async (saleId: string) => {
    try {
      setIsLoading(true);
      const response = await fetchSaleDetailAction(saleId);
      if (response.success && response.data && onSelectSale) {
        onSelectSale(response.data);
        setSelectedSaleId(saleId);
      } else {
        toast.error(response.message || 'Failed to load sale details');
      }
    } catch (error) {
      console.error('Error loading sale:', error);
      toast.error('Failed to load sale details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'CASH': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'CARD': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'E_WALLET': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'BANK_TRANSFER': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
      'COD': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    };
    return colors[method] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Receipt History</CardTitle>
            <CardDescription>View and manage all transactions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="sm:self-start"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg border border-border">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <Input
              type="text"
              placeholder="Search by Receipt ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Payment Method Filter */}
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-1 block">Payment Method</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              >
                <option value="all">All Methods</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-1 block">Date Range</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filterDateRange === 'custom' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-foreground/70 mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/70 mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                  />
                </div>
              </>
            )}
          </div>

          {/* Results Info */}
          <p className="text-xs text-foreground/60">
            Showing {paginatedSales.length} of {filteredSales.length} receipts
          </p>
        </div>

        {/* Receipts Table */}
        {paginatedSales.length > 0 ? (
          <div className="space-y-3">
            {paginatedSales.map((sale) => (
              <div
                key={sale.id}
                className={`p-4 border rounded-lg transition-all duration-200 ${
                  selectedSaleId === sale.id
                    ? 'bg-primary/5 border-primary'
                    : 'bg-background border-border hover:border-primary/50 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Receipt Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <code className="text-xs font-mono font-semibold text-foreground/70 bg-background px-2 py-1 rounded">
                        {sale.id.substring(0, 12)}...
                      </code>
                      <Badge className={getPaymentMethodColor(sale.paymentMethod)}>
                        {sale.paymentMethod}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-foreground/60 text-xs mb-0.5">Customer</p>
                        <p className="font-semibold">{sale.customerName || 'Walk-in'}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60 text-xs mb-0.5">Items</p>
                        <p className="font-semibold">{sale.itemCount}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60 text-xs mb-0.5">Amount</p>
                        <p className="font-bold text-primary">${sale.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60 text-xs mb-0.5">Profit</p>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          ${sale.profit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/50 mt-2">
                      {formatDate(sale.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSale(sale.id)}
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {onDownloadPDF && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadPDF(sale.id)}
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    {onPrint && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrint(sale.id)}
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground/60">No receipts found</p>
            <p className="text-foreground/40 text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-foreground/60">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
