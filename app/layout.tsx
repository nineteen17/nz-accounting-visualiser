import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { OverlayProvider } from "@/components/learn/Overlay";
import { NavLinks } from "@/components/NavLinks";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kōwhai Café – Learn NZ Accounting",
  description: "A visual, step-by-step guide to accounting for a small New Zealand business.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NZ" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <OverlayProvider>
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-paper/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-kowhai-400 text-lg">☕</span>
                <span>Kōwhai Café <span className="hidden font-normal text-stone-500 sm:inline">· Learn Accounting</span></span>
              </Link>
              <NavLinks />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
            A learning tool. Kōwhai Café Ltd and everyone in it are fictional. Rates are for the 2026–27 year: always check{" "}
            <a className="underline" href="https://www.ird.govt.nz" target="_blank" rel="noreferrer">ird.govt.nz</a> for current figures.
          </footer>
        </OverlayProvider>
      </body>
    </html>
  );
}
