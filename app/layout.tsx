import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "SoulSync",
  description: "A shared home for Mpho and Konanani.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SoulSync",
  },
};

export const viewport: Viewport = {
  themeColor: "#6D2E46",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="ss-root">
        <div className="ss-shell">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
