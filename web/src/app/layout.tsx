import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";
import { getOfficeSettings } from "@/lib/office-settings";

const sans = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const office = await getOfficeSettings();
  const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const title = office.companyName;
  const description = `Office payment desk for ${office.companyName} — register rent payments and issue receipts`;
  const ogImage = `${siteUrl.replace(/\/$/, "")}/mf_logo.png`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${office.companyShort}`,
    },
    description,
    applicationName: office.companyShort,
    authors: [{ name: office.companyName }],
    creator: office.companyName,
    publisher: office.companyName,
    robots: { index: false, follow: false },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: office.companyShort,
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      shortcut: ["/icon-192.png"],
    },
    openGraph: {
      type: "website",
      locale: "en_GM",
      url: siteUrl,
      siteName: office.companyName,
      title,
      description,
      images: [{ url: ogImage, alt: office.companyName }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FB" },
    { media: "(prefers-color-scheme: dark)", color: "#F5F7FB" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
