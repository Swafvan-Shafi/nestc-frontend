'use client';

import React, { useState, useEffect } from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Hide sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  // Listen for custom toggle event from PageHeader
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  return (
    <html lang="en" className={`${inter.variable} antialiased dark`}>
      <body className="bg-[#0a0a0b] min-h-screen text-white overflow-x-hidden">
        {!isAuthPage && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
