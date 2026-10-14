import type { Metadata } from "next";
import "./globals.css";
import { pads } from "../lib/pads";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: "PADCOIN — Another day. Another launchpad.",
  description: `The Hood's launchpad scene, served roasted. Explore ${pads.length} launchpad entries, vote for the best punchlines, and add your own.`,
  metadataBase: new URL(siteUrl),
  openGraph: { title: "PADCOIN — The Launchpad Roast Board", description: "Every pad thinks it's the main character. Someone had to make the roast board.", images: ["/assets/launchpad-machine.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
