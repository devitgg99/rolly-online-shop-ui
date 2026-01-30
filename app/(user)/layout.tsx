import UserNavbar from "@/components/user/UserNavbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <main>{children}</main>
    </div>
  );
}