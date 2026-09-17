import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ADINTEL — Validate E-commerce Opportunities Before You Test",
    template: "%s — ADINTEL",
  },
  description:
    "Analyze competitor stores, ads, traffic, products and business signals with AI. Don't just find products. Validate them.",
  metadataBase: new URL("https://adintel.app"),
  openGraph: {
    title: "ADINTEL — Validate E-commerce Opportunities Before You Test",
    description: "Analyze competitors, monitor their ads, estimate business performance, and validate your next e-commerce opportunity.",
    siteName: "ADINTEL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ADINTEL — Validate E-commerce Opportunities Before You Test",
    description: "Don't just find products. Validate them.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SessionProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster position="bottom-right" />
            </TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
