'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Wallet,
  Clock,
  Users,
  BarChart3,
  Calendar,
  Percent,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchSalesAnalytics } from '@/services/sales.service';
import type { SalesAnalytics } from '@/types/sales.types';

interface SalesAnalyticsDashboardProps {
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export function SalesAnalyticsDashboard({
  defaultStartDate,
  defaultEndDate
}: SalesAnalyticsDashboardProps) {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  
  // Date range state
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStartDate || lastWeek);
  const [endDate, setEndDate] = useState(defaultEndDate || today);

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate, groupBy]);

  const loadAnalytics = async () => {
    if (!session?.backendToken) return;

    setIsLoading(true);
    try {
      const response = await fetchSalesAnalytics(
        startDate,
        endDate,
        groupBy,
        session.backendToken
      );

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        toast.error(response.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Analytics Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={today}
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalytics} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  Transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(analytics.totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Net earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.avgOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per transaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Sales by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cash</p>
                      <p className="text-2xl font-bold">{analytics.salesByPaymentMethod.CASH}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalSales > 0
                        ? ((analytics.salesByPaymentMethod.CASH / analytics.totalSales) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Card</p>
                      <p className="text-2xl font-bold">{analytics.salesByPaymentMethod.CARD}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalSales > 0
                        ? ((analytics.salesByPaymentMethod.CARD / analytics.totalSales) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Online</p>
                      <p className="text-2xl font-bold">{analytics.salesByPaymentMethod.ONLINE}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalSales > 0
                        ? ((analytics.salesByPaymentMethod.ONLINE / analytics.totalSales) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales by Hour (Peak Hours) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sales by Hour (Peak Times)
              </CardTitle>
              <CardDescription>Identify your busiest hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.salesByHour
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 10)
                  .map((hourData) => {
                    const maxSales = Math.max(...analytics.salesByHour.map(h => h.sales));
                    const percentage = (hourData.sales / maxSales) * 100;
                    
                    return (
                      <div key={hourData.hour} className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium">
                          {hourData.hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="flex-1 relative h-8 bg-muted rounded overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 20 && (
                              <span className="text-xs font-semibold text-white">
                                {hourData.sales} sales
                              </span>
                            )}
                          </div>
                        </div>
                        {percentage <= 20 && (
                          <div className="w-16 text-sm text-muted-foreground">
                            {hourData.sales}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sales Trend
              </CardTitle>
              <CardDescription>Revenue and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.salesByDay.map((dayData) => (
                  <div key={dayData.date} className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-muted-foreground">
                      {new Date(dayData.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative h-6 bg-muted rounded overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-end pr-2"
                            style={{
                              width: `${(dayData.revenue / Math.max(...analytics.salesByDay.map(d => d.revenue))) * 100}%`
                            }}
                          >
                            {dayData.revenue > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(dayData.revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="w-20 justify-center">
                          {dayData.sales} sales
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative h-4 bg-muted rounded overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600"
                            style={{
                              width: `${(dayData.profit / Math.max(...analytics.salesByDay.map(d => d.profit))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-emerald-600 w-20 text-right font-medium">
                          {formatCurrency(dayData.profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {analytics.salesByDay.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data for selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          {analytics.topCustomers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
                <CardDescription>Best customers by total spent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.name} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer.name || 'Walk-in Customer'}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(customer.totalSpent / customer.orderCount)}/order
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profit Margin Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Profit Margin Trend
              </CardTitle>
              <CardDescription>How profitable your sales are over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.profitMarginTrend.map((trend) => {
                  const isGood = trend.margin >= 20;
                  const isOk = trend.margin >= 10 && trend.margin < 20;
                  
                  return (
                    <div key={trend.date} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium text-muted-foreground">
                        {new Date(trend.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex-1 relative h-7 bg-muted rounded overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 flex items-center justify-end pr-2 ${
                            isGood ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            isOk ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${Math.min(trend.margin, 100)}%` }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {trend.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {isGood ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : !isOk ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
