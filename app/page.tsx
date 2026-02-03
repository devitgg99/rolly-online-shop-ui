'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, LogIn, Sparkles, Star, UserPlus, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [currentProduct, setCurrentProduct] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const products = [
    { 
      name: 'Hydra Essence Serum', 
      color: 'from-blue-500/20 to-blue-400/5',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80'
    },
    { 
      name: 'Luminous Night Cream', 
      color: 'from-purple-500/20 to-purple-400/5',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80'
    },
    { 
      name: 'Radiant Eye Contour', 
      color: 'from-pink-500/20 to-pink-400/5',
      image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&q=80'
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProduct((prev) => (prev + 1) % products.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Fully Responsive */}
      <div className="sticky top-0 z-50 py-2 sm:py-4">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative bg-background/90 backdrop-blur-xl rounded-full border border-border shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-full"></div>
            
            <div className="relative flex justify-between items-center h-14 sm:h-16 px-4 sm:px-6">
              {/* Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full"></div>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground relative z-10" />
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-foreground">Rolly</span>
                </div>
              </div>

              {/* Centered Desktop Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1 absolute left-1/2 -translate-x-1/2">
                <a href="#about" className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-all duration-200">
                  About
                </a>
                <a href="#products" className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-all duration-200">
                  Products
                </a>
                <a href="#benefits" className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-all duration-200">
                  Benefits
                </a>
                <a href="#contact" className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-all duration-200">
                  Contact
                </a>
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 rounded-full hover:bg-primary/10 transition-all duration-200">
                    <span className="text-sm">Login</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4">
                    <span>Register</span>
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden rounded-full hover:bg-primary/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown - Auth Only */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Dropdown Card */}
              <div className="lg:hidden absolute top-full left-0 right-0 mt-3 mx-3 sm:mx-6 bg-background/98 backdrop-blur-2xl rounded-3xl border border-primary/20 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 z-50">
                <div className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md shadow-primary/30">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Account</p>
                        <p className="text-xs text-foreground/60">Login or Register</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all"
                    >
                      <span className="text-foreground/60 text-lg">✕</span>
                    </button>
                  </div>

                  {/* Auth Buttons */}
                  <div className="space-y-3 pt-2">
                    <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-center rounded-2xl hover:bg-primary/10 h-12 font-semibold border-2 border-border hover:border-primary/40 transition-all duration-300"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    
                    <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        className="w-full justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary h-12 font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <UserPlus className="w-4 h-4 mr-2 relative z-10 group-hover:scale-110 transition-transform" />
                        <span className="relative z-10">Register</span>
                        <Sparkles className="w-3.5 h-3.5 ml-2 relative z-10" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Marquee Section */}
      <div className="relative bg-gradient-to-r from-primary via-primary/95 to-primary text-primary-foreground py-3 overflow-hidden border-b border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative flex">
          <div className="flex items-center gap-8 pr-8 animate-marquee whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">FREE SHIPPING ON ORDERS OVER $50</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary-foreground" />
              <span className="text-sm font-medium">10,000+ HAPPY CUSTOMERS</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">30-DAY MONEY BACK GUARANTEE</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary-foreground" />
              <span className="text-sm font-medium">CRUELTY-FREE & VEGAN</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">NEW COLLECTION NOW AVAILABLE</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary-foreground" />
              <span className="text-sm font-medium">DERMATOLOGIST TESTED</span>
            </div>
          </div>
          {/* Duplicate for seamless loop */}
          <div className="flex items-center gap-8 pr-8 animate-marquee whitespace-nowrap" aria-hidden="true">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">FREE SHIPPING ON ORDERS OVER $50</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary-foreground" />
              <span className="text-sm font-medium">10,000+ HAPPY CUSTOMERS</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">30-DAY MONEY BACK GUARANTEE</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary-foreground" />
              <span className="text-sm font-medium">CRUELTY-FREE & VEGAN</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">NEW COLLECTION NOW AVAILABLE</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-primary-foreground" />
              <span className="text-sm font-medium">DERMATOLOGIST TESTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="about" className="relative overflow-hidden scroll-mt-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full border border-primary/20 mb-2 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-primary">✨ New Collection Available</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance text-foreground">
                  Transform your skin with <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">luxury skincare</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-foreground/70 text-balance leading-relaxed">
                  Discover our carefully curated collection of premium skincare products designed to reveal your most radiant skin. Clean ingredients, proven results.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
                  Explore Collection
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary/50 w-full sm:w-auto">
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 sm:pt-8 border-t border-border">
                <div className="group cursor-pointer">
                  <div className="text-xl sm:text-2xl font-bold text-primary group-hover:scale-110 transition-transform">10K+</div>
                  <p className="text-xs sm:text-sm text-foreground/60">Happy Customers</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-xl sm:text-2xl font-bold text-primary group-hover:scale-110 transition-transform">500+</div>
                  <p className="text-xs sm:text-sm text-foreground/60">5-Star Reviews</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-xl sm:text-2xl font-bold text-primary group-hover:scale-110 transition-transform">98%</div>
                  <p className="text-xs sm:text-sm text-foreground/60">Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Right Visual - Full Size Product Carousel */}
            <div className="relative md:block hidden h-[350px] sm:h-[450px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mt-8 lg:mt-0">
              <div className="relative w-full h-full">
                {/* Product Slides */}
                {products.map((product, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ${
                      currentProduct === index 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95'
                    }`}
                  >
                    {/* Full Size Product Image */}
                    <div className="relative w-full h-full group">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={index === 0}
                      />
                      {/* Subtle gradient overlay at bottom for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      {/* Product Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white z-10">
                        <h3 className="text-lg sm:text-xl lg:text-3xl font-bold mb-1 sm:mb-2">{product.name}</h3>
                        <p className="text-xs sm:text-sm lg:text-base text-white/90">Premium Skincare Collection</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Dots Indicator - Positioned at bottom */}
                <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex gap-1.5 sm:gap-2 justify-center z-20">
                  {products.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentProduct(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        currentProduct === idx
                          ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-white shadow-lg'
                          : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to product ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="bg-muted/30 py-12 sm:py-16 lg:py-32 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">Our Best Sellers</h2>
            <p className="text-base sm:text-lg text-foreground/70 text-balance px-4">Handpicked products loved by thousands of customers worldwide</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: 'Hydra Essence Serum', id: 'demo-product-1' },
              { name: 'Luminous Night Cream', id: 'demo-product-2' },
              { name: 'Radiant Eye Contour', id: 'demo-product-3' }
            ].map((product, idx) => (
              <Link 
                href={`/product/${product.id}`} 
                key={idx} 
                className="bg-card rounded-xl sm:rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border border-border hover:border-primary/30 hover:-translate-y-1 cursor-pointer block"
              >
                <div className="relative h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-center relative z-10">
                    <Sparkles className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 text-primary/40 mx-auto group-hover:text-primary/60 group-hover:scale-110 transition-all" />
                  </div>
                  <div 
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // TODO: Add to wishlist
                    }}
                  >
                    <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white hover:scale-110 transition-all shadow-lg w-8 h-8 sm:w-10 sm:h-10">
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary hover:fill-primary transition-all" />
                    </Button>
                  </div>
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20">
                    <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">New</span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-primary text-primary" />
                    ))}
                    <span className="text-xs sm:text-sm text-foreground/60 ml-1 sm:ml-2">(24 reviews)</span>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-foreground/60 text-xs sm:text-sm leading-relaxed">
                    Luxurious formula with advanced botanical extracts. Delivers visible results in 7 days.
                  </p>
                  
                  <div className="flex justify-between items-center pt-3 sm:pt-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">$89.00</span>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 text-xs sm:text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // TODO: Add to cart
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 sm:py-16 lg:py-32 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { title: 'Clean Ingredients', desc: 'Cruelty-free, vegan, and dermatologist tested' },
              { title: 'Fast Delivery', desc: 'Free shipping on orders over $50' },
              { title: '30-Day Guarantee', desc: 'Love it or your money back' },
              { title: 'Expert Support', desc: '24/7 customer care team ready to help' }
            ].map((benefit, idx) => (
              <div key={idx} className="text-center space-y-3 p-4 sm:p-6 rounded-xl hover:bg-primary/5 transition-all group cursor-pointer">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all border border-primary/10">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">{benefit.title}</h3>
                <p className="text-sm sm:text-base text-foreground/60">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-16 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance px-4">
            Ready to transform your skin? ✨
          </h2>
          <p className="text-base sm:text-lg opacity-90 text-balance max-w-2xl mx-auto px-4">
            Join thousands of customers who have discovered their best skin with Rolly. Start your skincare journey today.
          </p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
            Shop Now
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="contact" className="py-12 sm:py-16 lg:py-32 border-t border-border scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Stay Updated</h2>
            <p className="text-base sm:text-lg text-foreground/70 px-4">Get exclusive tips, new product launches, and special offers delivered to your inbox.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="bg-primary hover:bg-primary/90 text-sm sm:text-base">Subscribe</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-base sm:text-lg text-foreground">Rolly</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/60">Premium skincare for your best self.</p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Shop</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">All Products</a></li>
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">New Arrivals</a></li>
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">Best Sellers</a></li>
              </ul>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">About</a></li>
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">Contact</a></li>
              </ul>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Support</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">FAQs</a></li>
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">Privacy Policy</a></li>
                <li><a href="#" className="text-foreground/60 hover:text-primary transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-border text-center text-xs sm:text-sm text-foreground/60">
            <p>&copy; 2025 Rolly Online Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
