import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { CurrentUserProvider } from "@/components/current-user-provider";
import AppHeader from "@/components/layout/app-header";
import { MOCK_SIGNED_IN_USER_ID } from "@/data/mock-current-user";
import { MOCK_TEAM_MEMBERS } from "@/data/mock-team-members";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, geistHeading.variable)}
    >
      <body className="flex h-dvh flex-col">
        <CurrentUserProvider teamMembers={MOCK_TEAM_MEMBERS} signedInUserId={MOCK_SIGNED_IN_USER_ID}>
          <AppHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
