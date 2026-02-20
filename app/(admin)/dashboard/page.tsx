'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Activity
} from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const stats = [
    {
      name: 'ចំណូលសរុប',
      value: '$0',
      change: '+0%',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      name: 'ការបញ្ជាទិញ',
      value: '0',
      change: '+0%',
      icon: ShoppingCart,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'ផលិតផល',
      value: '0',
      change: '+0%',
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      name: 'អតិថិជន',
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            ផ្ទាំងគ្រប់គ្រង
          </h1>
          <p className="text-foreground/60">
            សូមស្វាគមន៍, <span className="font-semibold text-foreground">{session.user.name}</span>! 👋
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className={`text-sm font-semibold ${stat.color}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-foreground/60">{stat.name}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">សកម្មភាពថ្មីៗ</h2>
            </div>
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-foreground/60">គ្មានសកម្មភាពថ្មីៗ</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">ទិដ្ឋភាពរហ័ស</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-foreground/70">ការបញ្ជាទិញរង់ចាំ</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-foreground/70">ផលិតផលស្តុកទាប</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-foreground/70">អតិថិជនថ្មី</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-foreground/70">ចំណូលថ្ងៃនេះ</span>
                <span className="font-semibold text-green-500">$0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="mt-6 bg-primary/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">សម័យគ្រប់គ្រងសកម្ម</h3>
              <div className="text-sm text-foreground/70 space-y-1">
                <p><strong>អ៊ីមែល:</strong> {session.user.email}</p>
                <p><strong>តួនាទី:</strong> <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-semibold">{session.user.role}</span></p>
                <p><strong>លេខសម្គាល់អ្នកប្រើ:</strong> <span className="font-mono text-xs">{session.user.id}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}