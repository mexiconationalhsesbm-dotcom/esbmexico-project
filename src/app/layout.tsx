import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from "@/context/auth-context"
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AlertProvider } from "@/context/AlertContext";
import { IdleDetectionProvider } from '@/components/dashboard/idle-detection-provider';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <AlertProvider>
          <ThemeProvider>
            <AuthProvider>
              <IdleDetectionProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </IdleDetectionProvider>
            </AuthProvider>
          </ThemeProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
