'use client';

import { useSession } from "next-auth/react";
import { Settings, Bell, Lock, User, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();

  const settingsSections = [
    {
      title: "Profile Settings",
      icon: User,
      description: "Manage your account information",
      items: [
        { label: "Full Name", value: session?.user?.name || "N/A" },
        { label: "Email", value: session?.user?.email || "N/A" },
        { label: "Role", value: session?.user?.role || "N/A" },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      description: "Configure notification preferences",
      items: [
        { label: "Email Notifications", value: "Enabled" },
        { label: "Push Notifications", value: "Disabled" },
        { label: "SMS Alerts", value: "Disabled" },
      ]
    },
    {
      title: "Security",
      icon: Lock,
      description: "Manage security settings",
      items: [
        { label: "Two-Factor Auth", value: "Not Enabled" },
        { label: "Last Password Change", value: "Never" },
        { label: "Active Sessions", value: "1" },
      ]
    },
    {
      title: "Appearance",
      icon: Palette,
      description: "Customize your interface",
      items: [
        { label: "Theme", value: "System" },
        { label: "Language", value: "English" },
        { label: "Timezone", value: "UTC+7" },
      ]
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="bg-card border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>

                <div className="space-y-3 ml-13">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Irreversible actions that require careful consideration
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              Delete Account
            </Button>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              Clear All Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
