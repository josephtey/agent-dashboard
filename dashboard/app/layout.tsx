import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clide",
  description: "Your agent orchestration dashboard - manage Claude agents across multiple projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
