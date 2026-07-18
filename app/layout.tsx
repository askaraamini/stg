import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans";
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body className="min-h-screen overflow-y-auto font-sans bg-sky-blue-bg text-ink-navy">
        <UserProvider>
          <ScanProvider>
            {children}
          </ScanProvider>
        </UserProvider>
      </body>
    </html>
  );
}
