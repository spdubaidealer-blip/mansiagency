import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mansi Diamond Agency - Instant Chamet Coin Top-up",
  description: "Official top-up center for Chamet Coins. Buy Chamet diamonds securely via UPI (India) and Botim Pay, duPay, or e& money (UAE). Fast delivery in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <Toaster position="top-right" toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid #334155"
          }
        }} />
        {children}
      </body>
    </html>
  );
}
