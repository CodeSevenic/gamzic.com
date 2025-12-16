import type { Metadata } from "next";
import { Orbitron, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gamzic - Youth Esports Platform",
  description: "The home of youth esports — where students compete, connect, and become champions.",
  keywords: ["esports", "gaming", "tournaments", "high school", "college", "competitive gaming"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${orbitron.variable} ${rajdhani.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <ToastProvider />
          <Navbar />
          <Sidebar />
          <main className="pt-16 lg:pl-64 min-h-screen">
            <div className="cyber-grid min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
