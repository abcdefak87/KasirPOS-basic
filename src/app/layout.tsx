import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KasirPOS — Konter & Printing",
  description: "Aplikasi kasir sederhana untuk usaha konter dan printing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${geist.className} min-h-screen antialiased text-text`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
