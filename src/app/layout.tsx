import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Superboard — Free Collaborative Whiteboard",
  description: "A powerful infinite canvas whiteboard built with React, SVG, and perfect-freehand. Free and open source.",
};

// F-08 tablet polish: viewport allows zoom (accessibility) but
// prevents the double-tap zoom that breaks drawing on iPads.
// theme-color matches the brand gradient for the iOS status bar.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,  // allow user zoom for accessibility, but cap it
  userScalable: true,
  themeColor: "#059669",
  viewportFit: "cover",  // respect safe areas on notched devices
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
