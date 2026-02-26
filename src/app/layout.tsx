import type { Metadata } from "next";
import { Ubuntu, Roboto } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ubuntu",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Hyperliquid Builder Codes Demo",
  description:
    "Interactive demo showing how to integrate builder codes on Hyperliquid — connect your wallet and try it live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`next-dark-theme ${ubuntu.variable} ${roboto.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;600;700&family=Roboto:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${ubuntu.variable} ${roboto.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
