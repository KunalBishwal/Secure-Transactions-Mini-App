import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mirfa Secure Tx",
  description: "Secure Transaction App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}