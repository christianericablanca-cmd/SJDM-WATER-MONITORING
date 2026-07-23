import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { LanguageProvider } from "@/components/ui/language-provider";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { ToastNotificationProvider } from "@/components/ui/toast-provider";
import { NetworkStatus } from "@/components/ui/network-status";
import { PwaRegister } from "@/components/ui/pwa-register";
import { DisclaimPopover } from "@/components/layout/disclaim-popover";
import { BugReportButton } from "@/components/ui/bug-report-button";

export const metadata: Metadata = {
  title: "WaterWatch SJDM — Community Water Monitoring",
  description:
    "A community water monitoring and assistance platform helping San Jose del Monte, Bulacan residents report issues and find available resources during water interruptions.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WaterWatch SJDM",
    statusBarStyle: "default",
  },
  applicationName: "WaterWatch SJDM",
  keywords: ["water", "SJDM", "San Jose del Monte", "Bulacan", "water interruption", "community"],
  authors: [{ name: "WaterWatch SJDM Community" }],
  openGraph: {
    title: "WaterWatch SJDM",
    description: "Community Water Monitoring for San Jose del Monte, Bulacan",
    type: "website",
    siteName: "WaterWatch SJDM",
    locale: "en_PH",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d7abf",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem("theme")||"system";if(t==="system"){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`,
        }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
        <LanguageProvider>
        <ToastNotificationProvider>
          <NetworkStatus />
          <Header />
          <BottomNav />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <DisclaimPopover />
          <BugReportButton />
          <PwaRegister />
        </ToastNotificationProvider>
        </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
