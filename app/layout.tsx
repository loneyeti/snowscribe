import type { Metadata } from "next";
import { inter, cactusSerif } from "@/lib/fonts"; // Import from new fonts file
import "./globals.css";

export const metadata: Metadata = {
  title: "Snowscribe", // Updated title
  description: "The AI-powered novel writing companion.", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${cactusSerif.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
