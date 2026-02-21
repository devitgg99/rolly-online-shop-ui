'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  Package, 
  LogOut, 
  Menu,
  Store,
  User,
  Bell,
  ChevronRight,
  Tag,
  Receipt,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useLocale } from '@/context/LocaleContext';

const navKeys = [
  { key: 'nav_pos', href: '/pos', icon: Monitor },
  { key: 'nav_products', href: '/products', icon: Package },
  { key: 'nav_categories', href: '/categories', icon: Tag },
  { key: 'nav_sales', href: '/sales', icon: Receipt },
];

export default function AdminSidebar() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => pathname === href;
  const navigation = navKeys.map(({ key, href, icon }) => ({ name: t(key), href, icon }));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/products" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Rolly Admin</h1>
            <p className="text-xs text-muted-foreground">{t('nav_dashboard')}</p>
          </div>
        </Link>
      </div>

      <div className="px-4 pb-2">
        <LanguageSwitch className="w-full" />
      </div>

      <Separator className="mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('nav_menu')}
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              )}
              {!active && (
                <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="mt-2" />

      {/* User Info & Actions */}
      <div className="p-4 space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-accent/50 rounded-lg border border-border/50">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {session?.user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                {session?.user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <Link href="/profile">
              <User className="w-4 h-4 mr-1.5" />
              {t('nav_account')}
            </Link>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            {t('logout')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/products" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold text-sm">Rolly Admin</span>
              <p className="text-[10px] text-muted-foreground">{t('nav_dashboard')}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r bg-background shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}
