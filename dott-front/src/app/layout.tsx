import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ContextProvider } from "@/contexts/global.context";

export const metadata: Metadata = {
  title: {
    default: "Dott PC",
    template: "%s | Dott PC",
  },
  applicationName: "Dott PC",
  themeColor: "#ffffff",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen w-full flex-col">
        <ContextProvider>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </ContextProvider>
      </body>
    </html>
  );
}
