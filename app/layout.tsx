import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ErpProvider } from "@/context/ErpContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import UserPreferencesInitializer from "@/components/UserPreferencesInitializer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "ERP 企業資源規劃系統",
  description: "人資管理 ERP 系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserPreferencesInitializer />
          <ErpProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ErpProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
