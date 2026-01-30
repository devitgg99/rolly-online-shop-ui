'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            My Wishlist
          </h1>
          <p className="text-foreground/60">Save your favorite products here</p>
        </div>

        {/* Stats Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Total Items</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-foreground/60 mb-6 max-w-md mx-auto">
              Browse our products and click the heart icon to save items you love
            </p>
            <Button asChild>
              <a href="/">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Start Shopping
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
