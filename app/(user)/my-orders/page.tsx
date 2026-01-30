'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ShoppingBag, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyOrdersPage() {
  const { data: session, status } = useSession();

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

  if (!session) {
    redirect("/login");
  }

  const orderStats = [
    { label: 'Pending', count: 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Processing', count: 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Shipped', count: 0, icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Delivered', count: 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            My Orders
          </h1>
          <p className="text-foreground/60">Track and manage your orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {orderStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold mb-1">{stat.count}</p>
                <p className="text-sm text-foreground/60">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-foreground/60 mb-6">
              Start shopping and your orders will appear here
            </p>
            <Button asChild>
              <a href="/">Browse Products</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
