'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  Home,
  ShoppingBag, 
  Heart,
  User as UserIcon,
  LogOut, 
  Menu, 
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'ទំព័រដើម', href: '/', icon: Home },
  { name: 'ការបញ្ជាទិញ', href: '/my-orders', icon: ShoppingBag },
  { name: 'បញ្ជីចង់បាន', href: '/wishlist', icon: Heart },
  { name: 'គណនី', href: '/profile', icon: UserIcon },
];

export default function UserNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Rolly</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                      ${active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-2 animate-fade-in">
                      <div className="px-3 py-2 border-b border-border mb-2">
                        <p className="text-sm font-semibold">{session?.user?.name}</p>
                        <p className="text-xs text-foreground/60 truncate">{session?.user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                        onClick={() => setProfileOpen(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>គណនីរបស់ខ្ញុំ</span>
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-sm mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ចាកចេញ</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden rounded-xl"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/50 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
                  <p className="text-xs text-foreground/60 truncate">{session?.user?.email}</p>
                </div>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}

              {/* Sign Out */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">ចាកចេញ</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
