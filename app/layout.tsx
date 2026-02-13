import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ნინი და ლუკა | სიყვარულის სივრცე",
  description: "მოძრავი სიყვარულის ფოტოები, მუსიკა და რომანტიკული ტექსტები."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
