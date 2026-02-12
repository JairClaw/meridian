import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { PrivacyProvider } from "@/components/privacy-provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meridian | Personal Finance",
  description: "Sophisticated personal finance management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <PrivacyProvider>
            <MobileNav />
            <div className="flex min-h-screen pt-14 lg:pt-0">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <div className="container max-w-7xl mx-auto p-4 lg:p-8">
                  {children}
                </div>
              </main>
            </div>
          </PrivacyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
