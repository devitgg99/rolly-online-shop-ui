'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Activity,
  ArrowUpRight,
  Clock,
  Zap
} from "lucide-react";
import { fetchTodaysSummaryAction } from "@/actions/sales/sales.action";
import { SaleSummary } from "@/types/sales.types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<SaleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetchTodaysSummaryAction();
        if (response.success && response.data) {
          setSummary(response.data);
        }
      } catch (error) {
        console.error('Error loading summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadSummary();
      const interval = setInterval(loadSummary, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stats = [
    {
      name: 'Today Revenue',
      value: summary ? formatCurrency(summary.totalRevenue) : '$0',
      subText: 'Total sales',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      highlight: true,
    },
    {
      name: 'Total Orders',
      value: summary?.totalSales || '0',
      subText: 'Sales count',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Products Sold',
      value: summary?.totalProductsSold || '0',
      subText: 'Units today',
      icon: Package,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      name: 'Today Profit',
      value: summary ? formatCurrency(summary.totalProfit) : '$0',
      subText: `${summary ? summary.profitMargin.toFixed(1) : 0}% margin`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      highlight: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-background/80">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <LayoutDashboard className="w-8 h-8 text-primary" />
                </div>
                Dashboard
              </h1>
              <p className="text-foreground/60 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Welcome back, <span className="font-semibold text-foreground">{session.user.name}</span>
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-foreground/60">Today</p>
              <p className="text-sm font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className={`relative group rounded-2xl p-6 transition-all duration-300 ${
                  stat.highlight
                    ? `bg-gradient-to-br ${stat.bgColor} border border-transparent hover:shadow-xl`
                    : 'bg-card border border-border hover:border-primary/50 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  {stat.highlight && (
                    <ArrowUpRight className={`w-5 h-5 ${stat.color}`} />
                  )}
                </div>
                <p className="text-sm text-foreground/60 mb-1">{stat.name}</p>
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">{stat.value}</h3>
                <p className="text-xs text-foreground/50">{stat.subText}</p>
              </div>
            );
          })}
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Card */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Today's Performance</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <p className="text-xs text-foreground/60 mb-1">Avg Order Value</p>
                <p className="text-lg font-bold">
                  {summary && summary.totalSales > 0 
                    ? formatCurrency(summary.totalRevenue / summary.totalSales)
                    : '$0'
                  }
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <p className="text-xs text-foreground/60 mb-1">Total Cost</p>
                <p className="text-lg font-bold">{summary ? formatCurrency(summary.totalCost) : '$0'}</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <p className="text-xs text-foreground/60 mb-1">Profit Margin</p>
                <p className="text-lg font-bold">{summary ? `${summary.profitMargin.toFixed(1)}%` : '0%'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Quick Links</h2>
            </div>
            <div className="space-y-3">
              <a href="/admin/sales" className="block p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 hover:border-primary/40">
                <p className="text-sm font-semibold text-primary">POS & Sales</p>
                <p className="text-xs text-foreground/60">Create new sales</p>
              </a>
              <a href="/admin/products" className="block p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20 hover:border-blue-500/40">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Products</p>
                <p className="text-xs text-foreground/60">Manage inventory</p>
              </a>
              <a href="/admin/brands" className="block p-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-colors border border-violet-500/20 hover:border-violet-500/40">
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Brands</p>
                <p className="text-xs text-foreground/60">Update brands</p>
              </a>
            </div>
          </div>
        </div>

        {/* Admin Info Card */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Admin Session</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-foreground/60 mb-1">Email</p>
                  <p className="font-mono text-xs">{session.user.email}</p>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">Role</p>
                  <span className="inline-block px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">{session.user.role}</span>
                </div>
                <div>
                  <p className="text-foreground/60 mb-1">User ID</p>
                  <p className="font-mono text-xs">{session.user.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
