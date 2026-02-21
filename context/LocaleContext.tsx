'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'km';

const STORAGE_KEY = 'rolly-locale';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const translations: Record<Locale, Record<string, string>> = {
  en: {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_benefits: 'Benefits',
    nav_about: 'About Us',
    nav_contact: 'Contact',
    nav_orders: 'My Orders',
    nav_wishlist: 'Wishlist',
    nav_account: 'Account',
    nav_login: 'Login',
    nav_register: 'Register',
    nav_pos: 'POS',
    nav_categories: 'Categories',
    nav_sales: 'Sales',
    nav_menu: 'Menu',
    nav_dashboard: 'Dashboard',
    account_label: 'Account',
    my_account: 'My Account',
    logout: 'Log out',
    lang_english: 'English',
    lang_khmer: 'ខ្មែរ',
  },
  km: {
    nav_home: 'ទំព័រដើម',
    nav_products: 'ផលិតផល',
    nav_benefits: 'អត្ថប្រយោជន៍',
    nav_about: 'អំពីយើង',
    nav_contact: 'ទំនាក់ទំនង',
    nav_orders: 'ការបញ្ជាទិញ',
    nav_wishlist: 'បញ្ជីចង់បាន',
    nav_account: 'គណនី',
    nav_login: 'ចូល',
    nav_register: 'ចុះឈ្មោះ',
    nav_pos: 'កន្លែងលក់',
    nav_categories: 'ប្រភេទ',
    nav_sales: 'ការលក់',
    nav_menu: 'មឺនុយ',
    nav_dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    account_label: 'គណនី',
    my_account: 'គណនីរបស់ខ្ញុំ',
    logout: 'ចាកចេញ',
    lang_english: 'English',
    lang_khmer: 'ខ្មែរ',
  },
};

const LocaleContext = createContext<LocaleContextType | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'km';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'km') return stored;
  return 'km';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('km');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'km' ? 'km' : 'en';
  }, [locale, mounted]);

  const setLocale = (next: Locale) => setLocaleState(next);

  const t = (key: string): string => {
    return translations[locale][key] ?? translations.km[key] ?? key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
