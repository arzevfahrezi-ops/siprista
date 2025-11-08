import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIPRISTA - Sistem Informasi Prestasi Siswa",
  description: "Sistem informasi terpadu untuk mencatat, memantau, dan melaporkan prestasi siswa secara digital dan terstruktur.",
  keywords: ["SIPRISTA", "Prestasi Siswa", "Sistem Informasi", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "SIPRISTA Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "SIPRISTA - Sistem Informasi Prestasi Siswa",
    description: "Sistem informasi terpadu untuk manajemen prestasi siswa",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIPRISTA - Sistem Informasi Prestasi Siswa",
    description: "Sistem informasi terpadu untuk manajemen prestasi siswa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
