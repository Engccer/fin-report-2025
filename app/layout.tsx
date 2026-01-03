"use client";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full bg-gray-50">
      <body className="h-full flex flex-col font-sans text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-primary focus:ring-2 focus:ring-primary"
        >
          본문으로 건너뛰기
        </a>
        <header>
          <Navigation />
        </header>
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-700">
              © 2025 함께하는장애인교원노동조합. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
