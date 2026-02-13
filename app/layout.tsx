import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nini x Luka | Love Game World",
  description: "Funny interactive couple games with level-based surprises."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
