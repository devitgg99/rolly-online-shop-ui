import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy-pro",
  subsets: ["latin", "khmer"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rolly - ផលិតផលថែទាំស្បែកប្រណីត | បំប្លែងស្បែករបស់អ្នក",
  description: "ស្វែងរកផលិតផលថែទាំស្បែកប្រណីតរបស់ Rolly ដែលបានជ្រើសរើសយ៉ាងប្រុងប្រយ័ត្ន។ គ្រឿងផ្សំស្អាត លទ្ធផលបង្ហាញច្បាស់។ ចូលរួមជាមួយអតិថិជនពេញចិត្តជាង 10K+។",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
