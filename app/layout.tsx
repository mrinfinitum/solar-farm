import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nsoul.example"),
  title: "NSoul | Commercial Energy for Southeast Oklahoma",
  description:
    "Explore the proposed 1 Cornerstone Lane Solar Farm, a 1.5 MW commercial solar project designed to provide qualified regional organizations with predictable energy pricing and zero upfront equipment investment.",
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
      "A proposed 1.5 MW commercial solar project for qualified organizations in Southeast Oklahoma.",
    images: [{ url: "/brand/nsoul-hero-solar-field.png", width: 1536, height: 1024, alt: "Illustrative NSoul commercial solar field" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NSoul | Southeast Oklahoma",
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
