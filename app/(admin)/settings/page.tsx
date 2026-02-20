'use client';

import { useSession } from "next-auth/react";
import { Settings, Bell, Lock, User, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();

  const settingsSections = [
    {
      title: "ការកំណត់គណនី",
      icon: User,
      description: "គ្រប់គ្រងព័ត៌មានគណនី",
      items: [
        { label: "ឈ្មោះពេញ", value: session?.user?.name || "N/A" },
        { label: "អ៊ីមែល", value: session?.user?.email || "N/A" },
        { label: "តួនាទី", value: session?.user?.role || "N/A" },
      ]
    },
    {
      title: "ការជូនដំណឹង",
      icon: Bell,
      description: "កំណត់រចនាសម្ព័ន្ធការជូនដំណឹង",
      items: [
        { label: "ការជូនដំណឹងអ៊ីមែល", value: "បើក" },
        { label: "ការជូនដំណឹង Push", value: "បិទ" },
        { label: "ការជូនដំណឹង SMS", value: "បិទ" },
      ]
    },
    {
      title: "សុវត្ថិភាព",
      icon: Lock,
      description: "គ្រប់គ្រងការកំណត់សុវត្ថិភាព",
      items: [
        { label: "ការផ្ទៀងផ្ទាត់ពីរជំហាន", value: "មិនបើក" },
        { label: "ផ្លាស់ប្តូរពាក្យសម្ងាត់ចុងក្រោយ", value: "មិនធ្លាប់" },
        { label: "សម័យសកម្ម", value: "1" },
      ]
    },
    {
      title: "រូបរាង",
      icon: Palette,
      description: "ប្ដូររូបរាងរបស់អ្នក",
      items: [
        { label: "ស្បែក", value: "ប្រព័ន្ធ" },
        { label: "ភាសា", value: "ខ្មែរ" },
        { label: "តំបន់ម៉ោង", value: "UTC+7" },
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
              <h1 className="text-3xl font-bold">ការកំណត់</h1>
              <p className="text-sm text-muted-foreground">
                គ្រប់គ្រងគណនី និងចំណូលចិត្ត
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
                    កែ
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
            តំបន់គ្រោះថ្នាក់
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            សកម្មភាពដែលមិនអាចត្រឡប់វិញ ត្រូវការការពិចារណាដោយប្រុងប្រយ័ត្ន
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              លុបគណនី
            </Button>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
              សម្អាតទិន្នន័យទាំងអស់
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
