import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";
import { AnalyticsPageView } from "@/components/ui/analytics-page-view";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("nsoul-theme");
      var theme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (_) {}
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "NSoul | Commercial Energy for the Oklahoma Region",
  description:
    "NSoul develops and operates regional solar infrastructure designed to provide qualified organizations with predictable energy pricing and zero upfront equipment investment.",
  applicationName: "NSoul",
  icons: { icon: "/brand/nsoul-mark.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "NSoul",
    title: "Commercial energy that costs less from day one.",
    description:
      "Regional commercial solar development for qualified organizations across the Oklahoma Region.",
    images: [{ url: "/brand/nsoul-hero-solar-field.png", width: 1536, height: 1024, alt: "Illustrative NSoul commercial solar field" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NSoul | Oklahoma Region",
    description: "Predictable commercial energy. Zero upfront equipment investment.",
    images: ["/brand/nsoul-hero-solar-field.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full"><AnalyticsPageView />{children}</body>
    </html>
  );
}
