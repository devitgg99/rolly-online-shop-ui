'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Package, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  fetchTopSellingProductsAction, 
  fetchTopSellingProductsByRangeAction 
} from '@/actions/sales/sales.action';
import type { TopSellingProduct } from '@/types/sales.types';

export default function TopSellingProducts() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('allTime');
  const [isLoading, setIsLoading] = useState(false);
  
  // Top selling data
  const [topSellingAllTime, setTopSellingAllTime] = useState<TopSellingProduct[]>([]);
  const [topSellingByRange, setTopSellingByRange] = useState<TopSellingProduct[]>([]);
  
  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(10);

  // Load all-time top sellers on mount
  useEffect(() => {
    if (activeTab === 'allTime') {
      loadTopSellingAllTime();
    }
  }, [activeTab]);

  const loadTopSellingAllTime = async () => {
    if (!session?.backendToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetchTopSellingProductsAction(limit);
      if (response.success && response.data) {
        setTopSellingAllTime(response.data);
      } else {
        toast.error('បរាជ័យក្នុងការផ្ទុកផលិតផលលក់ដាច់បំផុត');
      }
    } catch (error) {
      console.error('Error loading top selling products:', error);
      toast.error('បញ្ហាក្នុងការផ្ទុកទិន្នន័យ');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopSellingByRange = async () => {
    if (!session?.backendToken || !startDate || !endDate) {
      toast.error('សូមជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetchTopSellingProductsByRangeAction(startDate, endDate, limit);
      if (response.success && response.data) {
        setTopSellingByRange(response.data);
        toast.success(`បានផ្ទុកកំពូល ${response.data.length} ផលិតផល`);
      } else {
        toast.error('បរាជ័យក្នុងការផ្ទុកផលិតផលលក់ដាច់បំផុត');
      }
    } catch (error) {
      console.error('Error loading top selling products by range:', error);
      toast.error('បញ្ហាក្នុងការផ្ទុកទិន្នន័យ');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTopSellingList = (products: TopSellingProduct[]) => {
    if (products.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">គ្មានទិន្នន័យ</h3>
            <p className="text-muted-foreground text-sm">
              {isLoading ? 'កំពុងផ្ទុក...' : 'រកមិនឃើញទិន្នន័យការលក់សម្រាប់រយៈពេលនេះ'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {products.map((product, index) => (
          <Card key={product.productId} className="overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Rank Badge */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shrink-0 ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index === 0 ? '🥇' :
                   index === 1 ? '🥈' :
                   index === 2 ? '🥉' :
                   `#${index + 1}`}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-lg truncate">{product.productName}</h3>
                  <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-1 flex-wrap">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Package className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {product.totalQuantitySold} ឯកតា
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                      ចំណាត់ថ្នាក់ #{index + 1}
                    </Badge>
                  </div>
                </div>

                {/* Quantity Badge */}
                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-3xl font-bold text-green-600">
                    {product.totalQuantitySold}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">ឯកតា</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          <CardTitle className="text-lg sm:text-xl">ផលិតផលលក់ដាច់បំផុត 🏆</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">ផលិតផលល្អបំផុតតាមចំនួនដែលបានលក់</CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 h-9 sm:h-10">
            <TabsTrigger value="allTime" className="text-xs sm:text-sm">គ្រប់ពេល ⏳</TabsTrigger>
            <TabsTrigger value="range" className="text-xs sm:text-sm">ចន្លោះពេល 📆</TabsTrigger>
          </TabsList>

          {/* All Time Tab */}
          <TabsContent value="allTime" className="space-y-3 sm:space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="limitAllTime" className="text-xs sm:text-sm">បង្ហាញកំពូល</Label>
                <Input
                  id="limitAllTime"
                  type="number"
                  min="5"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                  className="w-20 sm:w-24 h-9 sm:h-10 text-sm"
                />
              </div>
              <Button 
                onClick={loadTopSellingAllTime}
                disabled={isLoading}
                className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
              >
                {isLoading ? 'កំពុងផ្ទុក...' : 'ផ្ទុកឡើងវិញ'}
              </Button>
            </div>

            {renderTopSellingList(topSellingAllTime)}
          </TabsContent>

          {/* Date Range Tab */}
          <TabsContent value="range" className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs sm:text-sm">កាលបរិច្ឆេទចាប់ផ្តើម</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs sm:text-sm">កាលបរិច្ឆេទបញ្ចប់</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="limitRange" className="text-xs sm:text-sm">បង្ហាញកំពូល</Label>
                <Input
                  id="limitRange"
                  type="number"
                  min="5"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="flex items-end sm:col-span-1 col-span-2">
                <Button 
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm" 
                  onClick={loadTopSellingByRange}
                  disabled={isLoading}
                >
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  {isLoading ? 'កំពុងផ្ទុក...' : 'ផ្ទុក'}
                </Button>
              </div>
            </div>

            {renderTopSellingList(topSellingByRange)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
