import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: "Fundata | Dashboard Ejecutivo",
  description: "Sistema de gestión de indicadores de la Fundación Luker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable}`}>
      <body className="antialiased font-sans h-screen flex overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative scroll-smooth">
          {children}
        </main>
      </body>
    </html>
  );
}
