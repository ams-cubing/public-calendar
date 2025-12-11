import { Geist, Geist_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { HeaderSkeleton } from "@/components/header-skeleton";
import { Suspense } from "react";
import { Toaster } from "sonner";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <Suspense fallback={<HeaderSkeleton />}>
            <Header />
          </Suspense>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
