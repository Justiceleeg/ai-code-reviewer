import type { Metadata } from "next";
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
  title: "AI Code Review",
  description: "Intelligent, contextual code review feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <div className="hidden md:block min-h-screen">{children}</div>
        <div className="md:hidden min-h-screen flex items-center justify-center p-8 text-center">
          <p className="text-foreground/70">
            AI Code Review is designed for desktop. Please use a larger screen.
          </p>
        </div>
      </body>
    </html>
  );
}
