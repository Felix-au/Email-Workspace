import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const domain = process.env.NEXT_PUBLIC_DOMAIN || "yourdomain.com";
const isMetainfosci = domain === "metainfosci.com";
const initialIcon = isMetainfosci ? "/metainfosci-icon.png" : "/Email-Workspace-Dark.png";

export const metadata: Metadata = {
  title: "Domain Email Workspace",
  description: `Secure, private email communications for the ${domain} domain.`,
  icons: {
    icon: initialIcon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme + '-theme');
                
                const domain = "${domain}";
                const isMetainfosci = domain === "metainfosci.com";
                const faviconHref = isMetainfosci 
                  ? "/metainfosci-icon.png" 
                  : (theme === "dark" ? "/Email-Workspace-Dark.png" : "/Email-Workspace-light.png");
                
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                  link = document.createElement('link');
                  link.rel = 'icon';
                  document.getElementsByTagName('head')[0].appendChild(link);
                }
                link.href = faviconHref;
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
