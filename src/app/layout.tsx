import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { DataModeProvider } from "@/components/data-mode-provider";
import { OnboardingTourProvider } from "@/components/onboarding-tour-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { buildThemeInitScript } from "@/lib/theme";
import { cn } from "@/lib/utils";

const geistHeading = Geist({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "FFL Admin", template: "%s | FFL Admin" },
  description: "NWTOS company-wide admin portal",
  // Internal tool: keep it out of search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme-init script sets the theme class and accent on <html>
    // before React hydrates, so those attributes intentionally differ from the server HTML.
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, geistHeading.variable)}
    >
      <head>
        {/*
          Applies the saved theme while the HTML is parsed, before first paint, so dark mode never
          flashes light. A plain <script> here (not next/script) because next/script's inline
          beforeInteractive scripts wait for Next's runtime to load.
        */}
        <script dangerouslySetInnerHTML={{ __html: buildThemeInitScript() }} />
      </head>
      <body className="flex h-dvh flex-col">
        <ThemeProvider>
          <DataModeProvider>
            <OnboardingTourProvider>{children}</OnboardingTourProvider>
          </DataModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
