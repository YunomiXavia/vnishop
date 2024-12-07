import type { Metadata } from "next";
import "./globals.scss";
import React from "react";

export const metadata: Metadata = {
  title: "WEB CMS FE Yunomix",
  description: "Website Cms Frontend by Yunomix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
