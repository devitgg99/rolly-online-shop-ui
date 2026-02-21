import UserNavbar from "@/components/user/UserNavbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <main className="px-4 sm:px-6 lg:px-8 py-6 min-h-[60vh]">{children}</main>
    </div>
  );
}