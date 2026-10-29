import type { Metadata } from "next";
import "./globals.css";
import { GlassNavbar } from "@/components/layout/GlassNavbar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "BioSeal — Private Physical-Condition Escrow on NEAR",
  description:
    "BioSeal turns irreversible physical indicators into private, verifiable conditions for releasing money across chains. Chemistry becomes the oracle. NEAR becomes the settlement layer.",
  keywords: [
    "BioSeal",
    "NEAR Protocol",
    "Physical Escrow",
    "Cold Chain Oracle",
    "NEAR AI",
    "Confidential TEE",
    "NEAR Intents",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-ink-primary font-sans flex flex-col selection:bg-primary-light selection:text-primary">
        <QueryProvider>
          <GlassNavbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
