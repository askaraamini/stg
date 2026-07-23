import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./globals.css";
import { UserProvider } from "@/lib/user-store";
import { ScanProvider } from "@/lib/scan-store";

export const metadata: Metadata = {
  title: "Aksaraa - Belajar Seru!",
  description: "Platform belajar interaktif untuk SD/SMP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="id"
        className="h-full antialiased"
      >
      <head>
      </head>
      <body className="min-h-screen font-sans bg-surface text-on-surface">
        <UserProvider>
          <ScanProvider>
            {children}
          </ScanProvider>
        </UserProvider>
      </body>
    </html>
  );
}
