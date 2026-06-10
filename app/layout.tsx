import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de Indicadores",
  description: "Sistema de gestión de indicadores de la Fundación Luker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable}`}>
      <body className="antialiased font-sans min-h-screen bg-gray-50 flex flex-col">
        <TopNav />
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
