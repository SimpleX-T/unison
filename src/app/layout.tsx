import type { Metadata } from "next";
import {
  Playfair_Display,
  Lora,
  DM_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Unison — Multilingual Collaboration, Real-Time",
  description:
    "The collaboration platform for global-first teams. Documents, task boards, and whiteboards — each in everyone's language, in real time.",
  keywords: [
    "collaboration",
    "multilingual",
    "real-time",
    "translation",
    "documents",
    "task board",
    "whiteboard",
  ],
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${lora.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      >
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
