import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { RemoteStorageProvider } from "@/contexts/RemoteStorageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPromptProvider } from "@/contexts/InstallPromptContext";
import { AppLayout } from "@/components/AppLayout";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LocalDataPrompt } from "@/components/LocalDataPrompt";
import { ShareReceiver } from "@/components/ShareReceiver";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Inspektor",
  description: "Inspect the contents of your remoteStorage",
  applicationName: "Inspektor",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inspektor",
    startupImage: "/icon.svg",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
        <InstallPromptProvider>
        <RemoteStorageProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <BottomNav />
          <InstallPrompt />
          <LocalDataPrompt />
          <Suspense>
            <ShareReceiver />
          </Suspense>
          <ServiceWorkerRegistration />
          <Toaster />
        </RemoteStorageProvider>
        </InstallPromptProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
