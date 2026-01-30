'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ShoppingCart, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
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

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-primary" />
              Orders
            </h1>
            <p className="text-foreground/60 mt-1">Manage customer orders and fulfillment</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export</Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search orders by ID, customer..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-foreground/60 mb-1">Total Orders</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-foreground/60 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-500">0</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-sm text-foreground/60 mb-4">
              Orders from customers will appear here
            </p>
            <Button variant="outline">View All Transactions</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
