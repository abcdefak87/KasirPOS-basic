import Sidebar from "@/components/Sidebar";
import { BrandProvider } from "@/components/BrandProvider";
import { fetchBusinessSettings } from "@/lib/business-settings";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const brand = await fetchBusinessSettings();
  return (
    <BrandProvider initialBrand={brand}>
      <div className="md:flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8 pb-24 md:pb-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </BrandProvider>
  );
}
