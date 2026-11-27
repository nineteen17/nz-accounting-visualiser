import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CURRENT_PAYROLL } from "@/lib/nz/rates";
import { OverlayProvider } from "@/components/learn/Overlay";
import { NavLinks } from "@/components/NavLinks";
import { Offline } from "@/components/Offline";
import { RatesNotice } from "@/components/RatesNotice";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// the phone's status bar takes the café's yellow when the site is installed
export const viewport: Viewport = { themeColor: "#f7c948" };

export const metadata: Metadata = {
  title: "Kōwhai Café – Learn NZ Accounting",
  description: "A visual, step-by-step guide to accounting for a small New Zealand business.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NZ" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <OverlayProvider>
          <a href="#main" className="sr-only z-50 rounded-lg bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-paper/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-kowhai-400 text-lg">☕</span>
                <span>Kōwhai Café <span className="hidden font-normal text-stone-500 sm:inline">· Learn Accounting</span></span>
              </Link>
              <NavLinks />
            </div>
          </header>
          <RatesNotice />
          <main id="main" tabIndex={-1} className="flex-1">{children}</main>
          <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
            A learning tool. Kōwhai Café Ltd and everyone in it are fictional. Rates are for the {CURRENT_PAYROLL.year} year: always check{" "}
            <a className="underline" href="https://www.ird.govt.nz" target="_blank" rel="noreferrer">ird.govt.nz</a> for current figures.
            <Offline />
          </footer>
        </OverlayProvider>
      </body>
    </html>
  );
}
