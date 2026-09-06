import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { getAvailableMonths } from "@/lib/queries";
import { SiteNav } from "@/components/site-nav";
import { ScrollVisibility } from "@/components/scroll-visibility";
import "./globals.css";

const arizona = localFont({
  src: "../fonts/ABCArizonaMixTrial-Light.woff2",
  weight: "300",
  display: "block",
  variable: "--font-arizona",
});

const helveticaNow = localFont({
  src: [
    { path: "../fonts/HelveticaNowDisplay-Light.woff2", weight: "300" },
    { path: "../fonts/HelveticaNowDisplay-Regular.woff2", weight: "400" },
    { path: "../fonts/HelveticaNowDisplay-Medium.woff2", weight: "500" },
  ],
  display: "block",
  variable: "--font-hnd",
});

export const metadata: Metadata = {
  title: "Overview · The Brass Lantern · Autumn",
  description: "Frontend build of the Autumn overview",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const months = await getAvailableMonths();
  return (
    <html
      lang="en"
      className={`${arizona.variable} ${helveticaNow.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-paper font-sans text-ink">
        {/* useSearchParams inside the nav needs a Suspense boundary under a
            server layout; the fallback stays empty for the blink before the
            month is known */}
        <Suspense fallback={null}>
          <SiteNav months={months} />
        </Suspense>
        <ScrollVisibility />
        {children}
      </body>
    </html>
  );
}
