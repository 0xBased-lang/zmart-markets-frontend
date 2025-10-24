import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { FallingGlitch } from "@/components/falling-glitch";
import { DataStream } from "@/components/data-stream";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZMART - Decentralized Prediction Markets",
  description: "Community-driven prediction markets on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} font-sans antialiased scan-lines noise-overlay`}>
        {/* 🌑 ULTRA CONSPIRACY MODE - Matrix Background */}
        <div className="fixed inset-0 z-0">
          <FallingGlitch
            glitchIntensity={0.08}
            fallSpeed={1.2}
            glitchSpeed={30}
          >
            <div />
          </FallingGlitch>
        </div>

        {/* 🌑 Data Streams on Sides */}
        <DataStream side="left" />
        <DataStream side="right" />

        {/* Main Content */}
        <div className="relative z-10">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
