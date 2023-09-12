import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "./components/Navbar";

import Footer from "./components/Footer";

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
      <body className="flex flex-col h-screen justify-between">
        <Navbar />

        {children}
        <Footer />
      </body>
    </html>
  );
}
