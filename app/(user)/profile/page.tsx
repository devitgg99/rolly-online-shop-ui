'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { User, Mail, Shield, Calendar, Key } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            My Profile
          </h1>
          <p className="text-foreground/60">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-6">
          {/* Avatar & Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-border">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-2xl flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/30">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-card"></div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-1">{session.user.name}</h2>
              <p className="text-foreground/60 mb-3">{session.user.email}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                {session.user.role}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60 mb-1">Email Address</p>
                <p className="font-medium truncate">{session.user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60 mb-1">Full Name</p>
                <p className="font-medium truncate">{session.user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60 mb-1">Account Role</p>
                <p className="font-medium">{session.user.role}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60 mb-1">User ID</p>
                <p className="font-mono text-xs truncate">{session.user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Account Security</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-foreground/70">Two-Factor Authentication</span>
              <span className="text-amber-500 font-medium">Not Enabled</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-foreground/70">Last Password Change</span>
              <span className="text-foreground/50">Never</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-foreground/70">Account Status</span>
              <span className="text-green-500 font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
