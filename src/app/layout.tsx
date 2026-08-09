import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Superboard — Smart Tutoring Whiteboard",
  description: "The all-in-one whiteboard for K-12 tutors. Real-time collaboration, AI quiz generation, built-in video calling, and GeoGebra graphing — designed for tutors who want to teach better, not harder.",
  keywords: ["tutoring", "whiteboard", "education", "superboard", "smart tools", "online teaching", "K-12", "AI tutoring", "interactive whiteboard"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Superboard — Smart Tutoring Whiteboard",
    description: "Turn every lesson into an interactive experience with AI-powered tools, video calling, and real-time collaboration.",
    type: "website",
    locale: "en_US",
    siteName: "Superboard",
    images: ['/og-image.png'],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superboard — Smart Tutoring Whiteboard",
    description: "The all-in-one whiteboard for K-12 tutors with AI quiz generation, video calling, and GeoGebra graphing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">Skip to main content</a>
        <div id="main-content">
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
