import { fetchBusinessSettings } from "@/lib/business-settings";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const brand = await fetchBusinessSettings();
  return (
    <LoginForm
      brand={{
        brand_name: brand?.brand_name || "KasirPOS",
        tagline: brand?.tagline || "Konter & Printing",
        logo_url: brand?.logo_url ?? null,
      }}
    />
  );
}
