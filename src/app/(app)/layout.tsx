import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WomoLog - Das Logbuch - CampCMS",
  description:
    "Unser digitales Wohnmobil Logbuch! Vielleicht auch eine kleine Inspiration für dich?",
  openGraph: {
    title: "WomoLog - Das Logbuch - CampCMS",
    description:
      "Unser digitales Wohnmobil Logbuch! Vielleicht auch eine kleine Inspiration für dich?",
    url: "https://womolog.ch",
    siteName: "WomoLog",
    images: [
      {
        url: "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/IMG_20210530_112044.webp&w=1920&q=75",
        width: 1920,
        height: 1080,
        alt: "WomoLog Wohnmobil Logbuch",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WomoLog - Das Logbuch - CampCMS",
    description:
      "Unser digitales Wohnmobil Logbuch! Vielleicht auch eine kleine Inspiration für dich?",
    images: [
      "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/IMG_20210530_112044.webp&w=1920&q=75",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var _paq = window._paq = window._paq || [];
              _paq.push(['trackPageView']);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="//analytics.kokomo.house/matomo/";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '3']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
