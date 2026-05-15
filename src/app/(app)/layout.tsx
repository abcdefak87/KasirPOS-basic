import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-md:flex-col max-md:pb-16">
      <Sidebar />
      <main className="flex-1 p-6 max-md:p-4">{children}</main>
    </div>
  );
}
