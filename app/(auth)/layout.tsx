'use client';

import { Award, Heart, Shield, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Auth Forms (Fully Responsive) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-5 sm:mb-6 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary to-primary/80 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">Rolly</span>
          </Link>

          {children}
        </div>
      </div>

      {/* Right Panel - Completely Redesigned (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col justify-center p-8 xl:p-12 text-white w-full max-w-xl mx-auto">
          {/* Hero Section */}
          <div className="mb-6">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <p className="text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Premium Skincare Brand
              </p>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold mb-3 leading-tight">
              Your Journey to
              <br />
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Radiant Skin Starts Here
              </span>
            </h1>
            <p className="text-sm text-white/90 leading-relaxed max-w-md">
              Join thousands who have transformed their skincare routine with our premium, clean beauty products.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-0.5">Top Rated</h3>
              <p className="text-xs text-white/80">500+ five-star reviews</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-0.5">Safe & Clean</h3>
              <p className="text-xs text-white/80">100% natural ingredients</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-0.5">Fast Results</h3>
              <p className="text-xs text-white/80">Visible in 7 days</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base mb-0.5">Loved By All</h3>
              <p className="text-xs text-white/80">10K+ happy customers</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 mb-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <p className="text-2xl font-bold">10K+</p>
                </div>
                <p className="text-[10px] text-white/80">Active Members</p>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-4 h-4" />
                  <p className="text-2xl font-bold">98%</p>
                </div>
                <p className="text-[10px] text-white/80">Satisfaction Rate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4" />
                  <p className="text-2xl font-bold">4.9</p>
                </div>
                <p className="text-[10px] text-white/80">Average Rating</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-white text-white" />
              ))}
            </div>
            <p className="text-xs mb-3 leading-relaxed italic">
              "Rolly transformed my skin in just 2 weeks! The results are amazing, and I love that all products are clean and natural."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                SM
              </div>
              <div>
                <p className="font-semibold text-xs">Sarah Miller</p>
                <p className="text-[10px] text-white/70">Verified Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}