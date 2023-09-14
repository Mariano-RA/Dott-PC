import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ContextProvider } from "./components/utils/global.context";
import { UserProvider } from "@auth0/nextjs-auth0/client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Dott PC</title>
      </head>
      <body className="flex flex-col w-full h-screen justify-between">
        <UserProvider>
          <ContextProvider>
            <Navbar />
            <div className="mt-16">{children}</div>
            <Footer />
          </ContextProvider>
        </UserProvider>
      </body>
    </html>
  );
}
