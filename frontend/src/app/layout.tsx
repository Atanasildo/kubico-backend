import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Kubico — Imóveis em Angola", template: "%s | Kubico" },
  description:
    "Encontra apartamentos, casas, terrenos e muito mais para arrendar ou comprar em Angola.",
  keywords: ["imóveis angola", "arrendamento luanda", "casas venda angola", "kubico"],
  openGraph: {
    title: "Kubico — Imóveis em Angola",
    description: "Plataforma angolana de imóveis para arrendamento e venda.",
    locale: "pt_AO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-surface dark:bg-dark-bg transition-colors duration-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
