import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/layout/ClientLayout";
import FirebaseMessagingSetup from "./components/FirebaseMessagingSetup";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Posty",
  description: "Posty — chia sẻ khoảnh khắc cùng bạn bè",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${sans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
        <FirebaseMessagingSetup />
      </body>
    </html>
  );
}
