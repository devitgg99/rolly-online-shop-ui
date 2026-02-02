'use client';

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn, Mail, Phone } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { formatPhoneNumber } from "@/lib/phone";

type LoginMethod = 'email' | 'phone';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const registered = searchParams.get('registered');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Get credential based on login method
    let credential = loginMethod === 'email' ? email : formatPhoneNumber(phone);
    
    try {
      const res = await signIn("credentials", {
        email: credential,
        password,
        redirect: false,
      });      
      if (res?.error) {
        setError('Invalid credentials. Please try again.');
        return;
      }

      if (res?.ok) {
        // Redirect based on role for better UX
        // The middleware will still enforce security even if this is bypassed
        
        // You can decode the JWT token to get the role immediately
        // Or fetch session after successful login
        const session = await fetch('/api/auth/session').then(r => r.json());
        
        if (session?.user?.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/profile');
        }
        
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="w-full">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Sign In</h1>
        <p className="text-sm sm:text-base text-foreground/60">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create now
          </Link>
        </p>
      </div>

      {/* Success Message */}
      {registered && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ Registration successful! Please sign in with your credentials.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Login Method Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              loginMethod === 'email'
                ? 'bg-background text-primary shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              loginMethod === 'phone'
                ? 'bg-background text-primary shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Phone</span>
          </button>
        </div>

        {/* Email Input */}
        {loginMethod === 'email' && (
          <div className="animate-fade-in">
            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              E-mail Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-foreground/40" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
        )}

        {/* Phone Input */}
        {loginMethod === 'phone' && (
          <div className="animate-fade-in">
            <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              Phone Number 🇰🇭
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-foreground/40" />
              <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm sm:text-base text-foreground/60 font-medium">
                +855
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="12 345 678"
                className="w-full pl-24 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>
            <p className="text-xs text-foreground/50 mt-1">Enter without +855 prefix</p>
          </div>
        )}

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-xs sm:text-sm text-foreground/70">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-xs sm:text-sm text-primary hover:underline font-medium">
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-4 bg-background text-foreground/60">OR</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 hover:bg-foreground/5 transition-all"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="hidden sm:inline">Continue with Google</span>
            <span className="sm:hidden">Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 hover:bg-foreground/5 transition-all"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="hidden sm:inline">Continue with Facebook</span>
            <span className="sm:hidden">Facebook</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full flex items-center justify-center p-8">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
